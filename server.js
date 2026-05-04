require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const axios = require("axios");

const app = express();
app.use(express.json());

const db = new Database("database.sqlite");
const SECRET = "secret123";

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
   ANALYZE (FINAL OPTIMIZED PROMPT)
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

        // 🔥 مهم جدًا لتقليل الثبات
        temperature: 0.3,
        max_tokens: 1500,

        messages: [
          {
            role: "system",
            content: `
أنت خبير عالمي في تحليل محادثات المبيعات وخدمة العملاء.

🎯 الهدف:
تحليل دقيق جدًا يعتمد فقط على النص الحقيقي بدون أي تخمين.

━━━━━━━━━━━━━━━━━━━━━━━
🚨 قواعد إلزامية:
━━━━━━━━━━━━━━━━━━━━━━━
- الرد JSON فقط بدون أي شرح خارج JSON
- اللغة العربية فقط 100%
- ممنوع أي لغة أخرى
- ممنوع Markdown نهائياً
- لا يجوز اختراع أي جملة
- المحادثة نصية فقط (لا صور)

━━━━━━━━━━━━━━━━━━━━━━━
📊 نظام التقييم الإجباري:
━━━━━━━━━━━━━━━━━━━━━━━
- 10 = إغلاق صفقة مثالي + إقناع قوي بدون أخطاء
- 8-9 = أداء ممتاز مع أخطاء بسيطة
- 6-7 = أداء متوسط مع مشاكل في الإقناع
- 4-5 = ضعف واضح في إدارة العميل
- 1-3 = فشل في الإقناع أو خسارة فرصة

⚠️ ممنوع إعطاء رقم افتراضي مثل 7 بدون سبب واضح من النص

التقييم يجب أن يعتمد على:
- قوة الإقناع
- التعامل مع الاعتراضات
- إدارة العميل
- وضوح العرض
- سرعة الرد

━━━━━━━━━━━━━━━━━━━━━━━
📌 المطلوب:
━━━━━━━━━━━━━━━━━━━━━━━
1) تحليل عميق للمحادثة
2) استخراج الأخطاء الحقيقية فقط
3) كل خطأ يجب أن يحتوي على اقتباس حرفي 100%
4) شرح سبب الخطأ
5) طريقة تصحيح واضحة
6) نصائح تطوير

━━━━━━━━━━━━━━━━━━━━━━━
📦 الشكل الإلزامي:
━━━━━━━━━━━━━━━━━━━━━━━

{
  "rating": 0-10,
  "ratingJustification": "سبب واضح للتقييم بناء على المحادثة",

  "customerType": "مهتم / متردد / غير جاد / جاهز للشراء",

  "salesSkillScore": 0-10,
  "closingProbability": "٪",

  "analysis": "تحليل عربي عميق وصريح",

  "errors": [
    {
      "quote": "نص حرفي من المحادثة",
      "problem": "سبب الخطأ",
      "fix": "طريقة التصحيح"
    }
  ],

  "positives": [],
  "negatives": [],
  "improvementTips": []
}

🚨 قاعدة ذهبية:
إذا لم يوجد اقتباس حقيقي → لا تكتب خطأ
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
          "HTTP-Referer": "http://localhost",
          "X-Title": "Sales Analyzer"
        }
      }
    );

    let output = response.data.choices[0].message.content;

    // تنظيف أي Markdown
    output = output.replace(/```json|```/g, "").trim();

    const start = output.indexOf("{");
    const end = output.lastIndexOf("}");

    const json = JSON.parse(output.substring(start, end + 1));

    res.json(json);

  } catch (err) {
    console.log("OPENROUTER ERROR:", err.response?.data || err.message);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ========================
   SERVER
======================== */
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
