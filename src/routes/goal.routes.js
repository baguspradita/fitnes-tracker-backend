const express = require("express");
const prisma = require("../config/db");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createGoalSchema, updateGoalSchema } = require("../validations/goal.validation");

const router = express.Router();

router.use(auth);

// GET all goals
router.get("/", async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      include: { exercise: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create goal
router.post("/", validate(createGoalSchema), async (req, res) => {
  try {
    const goal = await prisma.goal.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json(goal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update goal
router.put("/:id", validate(updateGoalSchema), async (req, res) => {
  try {
    const goal = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    const updated = await prisma.goal.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE goal
router.delete("/:id", async (req, res) => {
  try {
    const goal = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ message: "Goal deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;