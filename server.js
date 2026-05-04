import dotenv from "dotenv";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";
import axios from "axios";

dotenv.config();

const app = express();
app.use(express.json());

const db = new Database("database.sqlite");

const SECRET = process.env.JWT_SECRET || "secret123";

/* ========================
   DEBUG (مهم جدًا)
======================== */
console.log("OPENROUTER KEY LOADED:", !!process.env.OPENROUTER_API_KEY);

/* ========================
   DB
======================== */
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT
)
`).run();

/* ========================
   HEALTH CHECK
======================== */
app.get("/", (req, res) => {
  res.send("AI Server is running 🚀");
});

/* ========================
   ANALYZE
======================== */
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "text is required" });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o",
        temperature: 0.3,
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: `
أنت محلل مبيعات احترافي.
أعد الرد JSON فقط بدون أي نص إضافي.
            `
          },
          {
            role: "user",
            content: text
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai-bgh5.onrender.com",
          "X-Title": "AI Analyzer"
        }
      }
    );

    let output = response.data.choices[0].message.content;

    // تنظيف Markdown
    output = output.replace(/```json|```/g, "").trim();

    const start = output.indexOf("{");
    const end = output.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return res.status(500).json({
        error: "Invalid AI response format",
        raw: output
      });
    }

    const json = JSON.parse(output.substring(start, end + 1));

    return res.json(json);

  } catch (err) {
    console.log("🔥 OPENROUTER ERROR FULL:");
    console.log(err.response?.data || err.message);

    return res.status(500).json({
      error: "AI request failed",
      details: err.response?.data || err.message
    });
  }
});

/* ========================
   START SERVER
======================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
