const express = require("express");
const prisma = require("../config/db");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createNutritionSchema, updateNutritionSchema } = require("../validations/nutrition.validation");

const router = express.Router();

router.use(auth);

// GET nutrition logs (optionally by date)
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;
    const where = { userId: req.user.id };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }

    const logs = await prisma.nutritionLog.findMany({
      where,
      orderBy: { date: "desc" },
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET daily summary
router.get("/summary", async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await prisma.nutritionLog.findMany({
      where: {
        userId: req.user.id,
        date: { gte: targetDate, lte: endOfDay },
      },
    });

    const summary = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        proteinG: acc.proteinG + parseFloat(log.proteinG),
        carbsG: acc.carbsG + parseFloat(log.carbsG),
        fatG: acc.fatG + parseFloat(log.fatG),
        count: acc.count + 1,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, count: 0 }
    );

    res.json({ ...summary, logs });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST create nutrition log
router.post("/", validate(createNutritionSchema), async (req, res) => {
  try {
    const log = await prisma.nutritionLog.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update nutrition log
router.put("/:id", validate(updateNutritionSchema), async (req, res) => {
  try {
    const log = await prisma.nutritionLog.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!log) return res.status(404).json({ error: "Log not found" });

    const updated = await prisma.nutritionLog.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE nutrition log
router.delete("/:id", async (req, res) => {
  try {
    const log = await prisma.nutritionLog.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!log) return res.status(404).json({ error: "Log not found" });

    await prisma.nutritionLog.delete({ where: { id: req.params.id } });
    res.json({ message: "Log deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;