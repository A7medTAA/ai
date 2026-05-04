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
  res.send("🚀 AI Sales Analyzer API is running");
});

/* ========================
   ANALYZE ENDPOINT
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
أنت خبير عالمي في تحليل محادثات المبيعات وخدمة العملاء.

🎯 الهدف:
تحليل دقيق يعتمد فقط على النص الحقيقي بدون تخمين.

━━━━━━━━━━━━━━━━━━━━━━━
🚨 قواعد صارمة:
━━━━━━━━━━━━━━━━━━━━━━━
- الرد JSON فقط بدون شرح
- اللغة العربية فقط
- ممنوع Markdown
- ممنوع اختراع معلومات
- الاقتباسات لازم تكون حرفية 100%

━━━━━━━━━━━━━━━━━━━━━━━
📊 التقييم:
━━━━━━━━━━━━━━━━━━━━━━━
- 10 = إغلاق صفقة مثالي
- 8-9 = ممتاز
- 6-7 = متوسط
- 4-5 = ضعيف
- 1-3 = فشل

━━━━━━━━━━━━━━━━━━━━━━━
📦 الشكل المطلوب:

{
  "rating": 0-10,
  "ratingJustification": "",
  "customerType": "مهتم / متردد / غير جاد / جاهز للشراء",
  "salesSkillScore": 0-10,
  "closingProbability": "%",
  "analysis": "",
  "errors": [
    {
      "quote": "",
      "problem": "",
      "fix": ""
    }
  ],
  "positives": [],
  "negatives": [],
  "improvementTips": []
}

🚨 أي خطأ بدون اقتباس = مرفوض
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
          "HTTP-Referer": "https://your-app.onrender.com",
          "X-Title": "AI Sales Analyzer"
        }
      }
    );

    let output = response.data.choices[0].message.content;

    // تنظيف markdown
    output = output.replace(/```json|```/g, "").trim();

    const start = output.indexOf("{");
    const end = output.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return res.status(500).json({
        error: "Invalid AI response format"
      });
    }

    const json = JSON.parse(output.substring(start, end + 1));

    res.json(json);

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);

    res.status(500).json({
      success: false,
      error: err.message
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
