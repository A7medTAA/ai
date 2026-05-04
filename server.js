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
        model: "google/gemini-2.5-flash",

        temperature: 0.3,
        max_tokens: 1500,

        messages: [
          {
  role: "system",
  content: `
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
- المحادثة نصية فقط (لا صور)

━━━━━━━━━━━━━━━━━━━━━━━
👤 نطاق التحليل (مهم جدًا):
━━━━━━━━━━━━━━━━━━━━━━━
هذا التحليل موجه فقط لتقييم أداء موظف المبيعات.

🚫 ممنوع تمامًا تقديم أي ملاحظات أو نصائح خارج نطاق المبيعات مثل:
- إدارة المخزون
- توفير المنتجات أو الألوان
- التسعير الداخلي للشركة
- العمليات اللوجستية أو التشغيلية
- أي قرارات تخص الإدارة أو الشركة

✔️ المسموح فقط:
- الإقناع
- التعامل مع العميل
- الرد على الاعتراضات
- أسلوب التواصل
- إغلاق الصفقة
- سرعة الاستجابة
- جودة العرض البيعي

━━━━━━━━━━━━━━━━━━━━━━━
📊 نظام التقييم الإجباري:
━━━━━━━━━━━━━━━━━━━━━━━
- 10 = إغلاق صفقة مثالي + إقناع قوي بدون أخطاء
- 8-9 = أداء ممتاز مع أخطاء بسيطة
- 6-7 = أداء متوسط مع مشاكل في الإقناع
- 4-5 = ضعف واضح في إدارة العميل
- 1-3 = فشل في الإقناع أو خسارة فرصة

⚠️ ممنوع إعطاء رقم افتراضي بدون سبب واضح من النص

━━━━━━━━━━━━━━━━━━━━━━━
📌 المطلوب:
━━━━━━━━━━━━━━━━━━━━━━━
1) تحليل عميق لأداء موظف المبيعات فقط
2) استخراج أخطاء المبيعات فقط
3) كل خطأ يجب أن يحتوي على اقتباس حرفي 100%
4) شرح سبب الخطأ من منظور مبيعات فقط
5) طريقة تصحيح لسلوك المبيعات فقط
6) نصائح تطوير مهارية في البيع فقط

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

🚨 قاعدة ذهبية:
أي نصيحة ليست مرتبطة مباشرة بأداء موظف المبيعات = تعتبر خطأ ويجب عدم ذكرها.
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
