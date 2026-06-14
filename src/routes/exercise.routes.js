const express = require("express");
const prisma = require("../config/db");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createExerciseSchema, updateExerciseSchema } = require("../validations/exercise.validation");

const router = express.Router();

router.use(auth);

// GET all exercises (default + user's custom)
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;

    const where = {
      OR: [
        { isCustom: false },
        { isCustom: true, userId: req.user.id },
      ],
    };

    if (category) where.category = category;
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: [{ isCustom: "desc" }, { name: "asc" }],
    });
    res.json(exercises);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET single exercise
router.get("/:id", async (req, res) => {
  try {
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: req.params.id,
        OR: [{ isCustom: false }, { isCustom: true, userId: req.user.id }],
      },
    });
    if (!exercise) return res.status(404).json({ error: "Exercise not found" });
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST create custom exercise
router.post("/", validate(createExerciseSchema), async (req, res) => {
  try {
    const exercise = await prisma.exercise.create({
      data: { ...req.body, isCustom: true, userId: req.user.id },
    });
    res.status(201).json(exercise);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update custom exercise
router.put("/:id", validate(updateExerciseSchema), async (req, res) => {
  try {
    const exercise = await prisma.exercise.findFirst({
      where: { id: req.params.id, userId: req.user.id, isCustom: true },
    });
    if (!exercise) return res.status(404).json({ error: "Exercise not found or not yours" });

    const updated = await prisma.exercise.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE custom exercise
router.delete("/:id", async (req, res) => {
  try {
    const exercise = await prisma.exercise.findFirst({
      where: { id: req.params.id, userId: req.user.id, isCustom: true },
    });
    if (!exercise) return res.status(404).json({ error: "Exercise not found or not yours" });

    await prisma.exercise.delete({ where: { id: req.params.id } });
    res.json({ message: "Exercise deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;