import express from "express";

const app = express();
app.use(express.json());

// 👇 الصفحة الرئيسية
app.get("/", (req, res) => {
  res.send("🚀 AI Analyzer API is running");
});

// 👇 التحليل
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  res.json({
    rating: 8,
    analysis: "تحليل تجريبي للنص",
    positives: ["أسلوب جيد"],
    negatives: ["تأخر في الرد"],
    criticalMistakes: [],
    improvementTips: ["سرّع الرد"]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));