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
            content: "أنت محلل مبيعات احترافي..."
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
          "HTTP-Referer": "https://your-app.onrender.com",
          "X-Title": "AI Analyzer"
        }
      }
    );

    let output = response.data.choices[0].message.content;

    output = output.replace(/```json|```/g, "").trim();

    const json = JSON.parse(
      output.substring(output.indexOf("{"), output.lastIndexOf("}") + 1)
    );

    res.json(json);

  } catch (err) {
    console.log(err.response?.data || err.message);

    res.status(500).json({
      error: "AI request failed"
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
