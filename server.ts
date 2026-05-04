import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/grade", async (req, res) => {
    try {
      const { question, ideal, answer } = req.body;
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Grade the following response to a quiz question about Srila Prabhupada's books.
      Question: ${question}
      Ideal Answer: ${ideal}
      Devotee Answer: ${answer}
      
      Return ONLY a numerical score between 0.0 and 1.0, where 1.0 is perfectly correct and matches the essence of the ideal answer, and 0.0 is completely wrong. No other text.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const score = parseFloat(text.trim()) || 0;

      res.json({ score });
    } catch (error) {
      console.error("Grading error:", error);
      res.status(500).json({ error: "Failed to grade answer" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
