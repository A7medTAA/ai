import express from "express";

const app = express();
app.use(express.json());

// endpoint الرئيسي
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  // هنا لاحقاً نحط AI حقيقي
  res.json({
    rating: 8,
    analysis: "تحليل تجريبي للنص",
    positives: ["أسلوب جيد", "محاولة إقناع واضحة"],
    negatives: ["تأخر في الرد"],
    criticalMistakes: [],
    improvementTips: ["اختصر الكلام", "ارفع سرعة الرد"]
  });
});

app.listen(3000, () => console.log("Server running on 3000"));