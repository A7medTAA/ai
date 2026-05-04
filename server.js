require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

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
أنت خبير عالمي في تحليل محادثات المبيعات وخدمة العملاء.

🚨 قواعد صارمة:
- الرد JSON فقط بدون أي نص خارج JSON
- بدون Markdown نهائياً
- بدون شرح خارج JSON
- لا تخترع بيانات غير موجودة

📦 الشكل الإجباري:

{
  "rating": 0-10,
  "ratingJustification": "",
  "customerType": "",
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
          "X-Title": "Sales Analyzer"
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
        error: "Invalid AI response",
        raw: output
      });
    }

    let json;

    try {
      json = JSON.parse(output.substring(start, end + 1));
    } catch (e) {
      return res.status(500).json({
        error: "JSON parse failed",
        raw: output
      });
    }

    return res.json(json);

  } catch (err) {
    console.log("🔥 OPENROUTER ERROR:", err.response?.data || err.message);

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
