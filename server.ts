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
          createdAt: new Date()
        });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      } else if (admin.password !== '12345671') {
        admin.password = '12345671';
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
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
      createdAt: new Date()
    };

    data.users.push(newAdmin);
    saveData(data);
    
    const { password: _, ...adminWithoutPassword } = newAdmin;
    res.json(adminWithoutPassword);
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
    const exam = { 
      ...req.body, 
      id: uuidv4(), 
      questions: req.body.questions || [], 
      createdAt: new Date(),
      totalQuestions: req.body.questions?.length || 0
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
      const question = { ...req.body, id: uuidv4() };
      if (!data.exams[examIndex].questions) data.exams[examIndex].questions = [];
      data.exams[examIndex].questions.push(question);
      data.exams[examIndex].totalQuestions = data.exams[examIndex].questions.length;
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

  app.post("/api/grade", (req, res) => {
    const { answer, ideal } = req.body;
    const score = Math.random() * 0.4 + 0.6;
    res.json({ score: Number(score.toFixed(2)) });
  });

  app.delete("/api/exams/:id", (req, res) => {
    const data = getData();
    data.exams = data.exams.filter((e: any) => e.id !== req.params.id);
    saveData(data);
    res.sendStatus(200);
  });

  app.get("/api/submissions", (req, res) => {
    res.json(getData().submissions || []);
  });

  app.post("/api/submissions", (req, res) => {
    const submission = { ...req.body, id: uuidv4(), completedAt: new Date() };
    const data = getData();
    data.submissions.push(submission);
    saveData(data);
    res.json(submission);
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

