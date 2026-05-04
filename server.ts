import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    users: [],
    exams: [],
    submissions: []
  }, null, 2));
}

function getData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());

// API Routes
app.get("/api/data", (req, res) => {
  res.json(getData());
});

app.post("/api/login", (req, res) => {
  const { email, password, name, type } = req.body;
  const data = getData();
  
  if (type === 'admin') {
    // Basic admin check for demo, can be expanded
    let user = data.users.find((u: any) => u.email === email && u.role === 'admin');
    if (!user && email === 'bharathidharani52@gmail.com') {
       user = { uid: uuidv4(), email, displayName: "Super Admin", role: 'admin', createdAt: new Date() };
       data.users.push(user);
       saveData(data);
    }
    if (user) {
      return res.json(user);
    }
    return res.status(401).json({ error: "Invalid admin credentials" });
  } else {
    // Devotee login (anonymous equivalent)
    const user = { uid: uuidv4(), displayName: name, role: 'devotee', createdAt: new Date() };
    data.users.push(user);
    saveData(data);
    res.json(user);
  }
});

app.get("/api/exams", (req, res) => {
  res.json(getData().exams);
});

app.post("/api/exams", (req, res) => {
  const exam = { ...req.body, id: uuidv4(), questions: [], createdAt: new Date() };
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
  res.json(exam ? exam.questions : []);
});

app.post("/api/grade", (req, res) => {
  // Mock AI grading - for local demo, we'll give a random accurate-looking score
  // In real use, this would call Gemini
  const { answer, ideal } = req.body;
  const score = Math.random() * 0.4 + 0.6; // Score between 0.6 and 1.0 for demo
  res.json({ score: Number(score.toFixed(2)) });
});

app.delete("/api/exams/:id", (req, res) => {
  const data = getData();
  data.exams = data.exams.filter((e: any) => e.id !== req.params.id);
  saveData(data);
  res.sendStatus(200);
});

app.get("/api/submissions", (req, res) => {
  res.json(getData().submissions);
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
  res.json(getData().users);
});

// Vite middleware
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
