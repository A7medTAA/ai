require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

/* ========================
   HEALTH CHECK
======================== */
app.get("/", (req, res) => {
  res.send("AI Server is running 🚀 (Gemini Mode)");
});

/* ========================
   ANALYZE (GEMINI)
======================== */
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "text is required" });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `
أنت خبير عالمي في تحليل محادثات المبيعات وخدمة العملاء.

🎯 الهدف:
تحليل دقيق جدًا يعتمد فقط على النص الحقيقي بدون أي تخمين، مع التركيز حصريًا على أداء موظف المبيعات فقط.

━━━━━━━━━━━━━━━━━━━━━━━
🚨 قواعد إلزامية:
━━━━━━━━━━━━━━━━━━━━━━━
- الرد JSON فقط بدون أي شرح خارج JSON
- اللغة العربية فقط 100%
- ممنوع أي لغة أخرى
- ممنوع Markdown نهائياً
- لا يجوز اختراع أي جملة
- المحادثة نصية فقط

━━━━━━━━━━━━━━━━━━━━━━━
📦 الشكل الإلزامي:
━━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━━
النص:
${text}
                `
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    let output = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // تنظيف أي Markdown
    output = output.replace(/```json|```/g, "").trim();

    const start = output.indexOf("{");
    const end = output.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return res.status(500).json({
        error: "Invalid Gemini response",
        raw: output
      });
    }

    const json = JSON.parse(output.substring(start, end + 1));

    return res.json(json);

  } catch (err) {
    console.log("🔥 GEMINI ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      error: "Gemini request failed",
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
