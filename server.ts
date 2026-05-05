import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' })); // Increased limit
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
  });

  const DATA_FILE = path.join(process.cwd(), 'data.json');

  // Initialize data file if it doesn't exist
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      users: [
        {
          uid: uuidv4(),
          email: 'bharathidharani52@gmail.com',
          password: '12345671',
          displayName: 'Super Admin',
          role: 'admin',
          isSuperAdmin: true,
          createdAt: new Date()
        }
      ],
      exams: [],
      submissions: []
    }, null, 2));
  }

  function getData() {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(content);
      
      // Ensure the primary admin exists and has the correct password
      let admin = data.users.find((u: any) => u.email === 'bharathidharani52@gmail.com');
      if (!admin) {
        data.users.push({
          uid: uuidv4(),
          email: 'bharathidharani52@gmail.com',
          password: '12345671',
          displayName: 'Super Admin',
          role: 'admin',
          isSuperAdmin: true,
          createdAt: new Date()
        });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      } else {
        let changed = false;
        if (admin.password !== '12345671') {
          admin.password = '12345671';
          changed = true;
        }
        if (!admin.isSuperAdmin) {
          admin.isSuperAdmin = true;
          changed = true;
        }
        if (changed) {
          fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        }
      }
      return data;
    } catch (e) {
      console.error("Error reading data file, resetting...", e);
      const empty = { 
        users: [
          {
            uid: uuidv4(),
            email: 'bharathidharani52@gmail.com',
            password: '12345671',
            displayName: 'Super Admin',
            role: 'admin',
            createdAt: new Date()
          }
        ], 
        exams: [], 
        submissions: [] 
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2));
      return empty;
    }
  }

  function saveData(data: any) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }

  // API Routes
  console.log("Registering API routes...");
  
  app.post("/api/login", (req, res) => {
    console.log("POST /api/login reached");
    const { email, password, name, type } = req.body;
    console.log(`Login attempt: ${type}`, { email, name });
    const data = getData();
    
    if (type === 'admin') {
      const user = data.users.find((u: any) => u.email === email && u.role === 'admin');
      
      if (user && user.password === password) {
        // Don't send password back
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }
      
      return res.status(401).json({ error: "Invalid admin email or password" });
    } else {
      const data = getData();
      // Case-insensitive name lookup to help users resume profiles
      const existingUser = data.users.find((u: any) => 
        u.displayName && name && u.displayName.toLowerCase() === name.toLowerCase() && u.role === 'devotee'
      );
      
      if (existingUser) {
        console.log(`Resuming session for existing devotee: ${existingUser.displayName}`);
        return res.json(existingUser);
      }

      const user = { uid: uuidv4(), displayName: name || 'Devotee', role: 'devotee', createdAt: new Date() };
      data.users.push(user);
      saveData(data);
      res.json(user);
    }
  });

  app.post("/api/admin/create", (req, res) => {
    const { adminId, newAdminEmail, newAdminPassword, newAdminName } = req.body;
    const data = getData();
    
    // Verify requester is an admin
    const requester = data.users.find((u: any) => u.uid === adminId && u.role === 'admin');
    if (!requester) {
      return res.status(403).json({ error: "Unauthorized. Only admins can create new admins." });
    }

    // Check if user already exists
    if (data.users.find((u: any) => u.email === newAdminEmail)) {
      return res.status(400).json({ error: "A user with this email already exists." });
    }

    const newAdmin = {
      uid: uuidv4(),
      email: newAdminEmail,
      password: newAdminPassword,
      displayName: newAdminName,
      role: 'admin',
      isSuperAdmin: false,
      createdAt: new Date()
    };

    data.users.push(newAdmin);
    saveData(data);
    
    const { password: _, ...adminWithoutPassword } = newAdmin;
    res.json(adminWithoutPassword);
  });

  app.delete("/api/admin/:id", (req, res) => {
    const adminId = req.query.adminId || req.body.adminId;
    const data = getData();
    
    const requester = data.users.find((u: any) => u.uid === adminId && u.isSuperAdmin);
    if (!requester) {
      return res.status(403).json({ error: "Only Super Admin can remove other admins." });
    }

    const targetIndex = data.users.findIndex((u: any) => u.uid === req.params.id);
    if (targetIndex === -1) return res.status(404).json({ error: "User not found" });

    // Cannot remove self
    if (req.params.id === adminId) {
      return res.status(400).json({ error: "Super Admin cannot remove themselves." });
    }

    data.users.splice(targetIndex, 1);
    saveData(data);
    res.json({ success: true });
  });

  app.post("/api/admin/transfer-super", (req, res) => {
    const { adminId, targetAdminId } = req.body;
    const data = getData();
    
    const requester = data.users.find((u: any) => u.uid === adminId && u.isSuperAdmin);
    if (!requester) {
      return res.status(403).json({ error: "Only Super Admin can transfer their power." });
    }

    const targetAdmin = data.users.find((u: any) => u.uid === targetAdminId && u.role === 'admin');
    if (!targetAdmin) return res.status(404).json({ error: "Target admin not found" });

    // Transfer power
    requester.isSuperAdmin = false;
    targetAdmin.isSuperAdmin = true;

    saveData(data);
    res.json({ success: true });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date(), version: "1.0.1" });
  });

  app.get("/api/data", (req, res) => {
    res.json(getData());
  });

  app.get("/api/exams", (req, res) => {
    res.json(getData().exams || []);
  });

  app.post("/api/exams", (req, res) => {
    const questions = req.body.questions || [];
    const totalPoints = questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0);
    
    const exam = { 
      ...req.body, 
      id: uuidv4(), 
      type: req.body.type || 'mcq', // 'mcq' or 'descriptive'
      questions: questions, 
      createdAt: new Date(),
      totalPoints: totalPoints
    };
    const data = getData();
    data.exams.push(exam);
    saveData(data);
    res.json(exam);
  });

  app.post("/api/exams/:id/questions", (req, res) => {
    const data = getData();
    const examIndex = data.exams.findIndex((e: any) => e.id === req.params.id);
    if (examIndex !== -1) {
      const question = { ...req.body, id: uuidv4(), points: req.body.points || 1 };
      if (!data.exams[examIndex].questions) data.exams[examIndex].questions = [];
      data.exams[examIndex].questions.push(question);
      
      // Recalculate total points
      data.exams[examIndex].totalPoints = data.exams[examIndex].questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0);
      
      saveData(data);
      res.json(question);
    } else {
      res.status(404).json({ error: "Exam not found" });
    }
  });

  app.get("/api/exams/:id/questions", (req, res) => {
    const data = getData();
    const exam = data.exams.find((e: any) => e.id === req.params.id);
    res.json(exam ? (exam.questions || []) : []);
  });

  app.delete("/api/exams/:id", (req, res) => {
    const { id } = req.params;
    const adminId = req.query.adminId || req.body.adminId;
    console.log(`[DELETE] Attempting to delete exam: ${id} by admin: ${adminId}`);
    const data = getData();
    
    // Auth check
    const requester = data.users.find((u: any) => u.uid === adminId && u.role === 'admin');
    if (!requester) {
      console.log(`[DELETE] Unauthorized delete attempt for exam: ${id} by: ${adminId}`);
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    const initialExamCount = data.exams.length;
    data.exams = data.exams.filter((e: any) => e.id !== id);
    const finalExamCount = data.exams.length;

    if (initialExamCount === finalExamCount) {
      console.log(`[DELETE] Exam not found: ${id}`);
    } else {
      console.log(`[DELETE] Exam deleted: ${id} by ${adminId}. Also removing related submissions.`);
      // Clean up related submissions
      data.submissions = data.submissions.filter((s: any) => s.examId !== id);
    }

    saveData(data);
    res.json({ success: true, deleted: initialExamCount !== finalExamCount });
  });

  app.get("/api/submissions", (req, res) => {
    res.json(getData().submissions || []);
  });

  app.post("/api/submissions", (req, res) => {
    const data = getData();
    const exam = data.exams.find((e: any) => e.id === req.body.examId);
    
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    let score = 0;
    const totalPoints = exam.questions.reduce((acc: number, q: any) => acc + (q.points || 1), 0);
    let status = exam.type === 'mcq' ? 'graded' : 'pending';

    // Auto-grade MCQs
    if (exam.type === 'mcq' && req.body.answers) {
      req.body.answers.forEach((ans: any) => {
        const question = exam.questions.find((q: any) => q.id === ans.questionId);
        if (question && question.correctOptionIndex === ans.answer) {
          score += (question.points || 1);
        }
      });
    }

    const submission = { 
      ...req.body, 
      id: uuidv4(), 
      status,
      score: exam.type === 'mcq' ? score : 0,
      totalPoints,
      completedAt: new Date() 
    };
    
    data.submissions.push(submission);
    saveData(data);
    res.json(submission);
  });

  // Manual grading endpoint
  app.post("/api/submissions/:id/grade", (req, res) => {
    const { score, feedback, adminId } = req.body;
    const data = getData();
    
    // Auth check
    const admin = data.users.find((u: any) => u.uid === adminId && u.role === 'admin');
    if (!admin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const index = data.submissions.findIndex((s: any) => s.id === req.params.id);
    if (index !== -1) {
      data.submissions[index].score = score;
      data.submissions[index].feedback = feedback;
      data.submissions[index].status = 'graded';
      data.submissions[index].gradedBy = adminId;
      data.submissions[index].gradedAt = new Date();
      
      saveData(data);
      res.json(data.submissions[index]);
    } else {
      res.status(404).json({ error: "Submission not found" });
    }
  });

  app.patch("/api/submissions/:id", (req, res) => {
    const data = getData();
    const index = data.submissions.findIndex((s: any) => s.id === req.params.id);
    if (index !== -1) {
      data.submissions[index] = { ...data.submissions[index], ...req.body };
      saveData(data);
      res.json(data.submissions[index]);
    } else {
      res.status(404).json({ error: "Submission not found" });
    }
  });

  app.get("/api/users", (req, res) => {
    res.json(getData().users || []);
  });

  // Catch-all for API to debug missing routes
  app.all("/api/*", (req, res) => {
    console.log(`Unmatched API route: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn("Dist folder not found, falling back to Vite if possible");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

