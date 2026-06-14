const express = require("express");
const prisma = require("../config/db");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createBodySchema, updateBodySchema } = require("../validations/body.validation");

const router = express.Router();

router.use(auth);

// GET all measurements
router.get("/", async (req, res) => {
  try {
    const measurements = await prisma.bodyMeasurement.findMany({
      where: { userId: req.user.id },
      orderBy: { date: "desc" },
    });
    res.json(measurements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create measurement
router.post("/", validate(createBodySchema), async (req, res) => {
  try {
    const measurement = await prisma.bodyMeasurement.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json(measurement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update measurement
router.put("/:id", validate(updateBodySchema), async (req, res) => {
  try {
    const m = await prisma.bodyMeasurement.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!m) return res.status(404).json({ error: "Measurement not found" });

    const updated = await prisma.bodyMeasurement.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE measurement
router.delete("/:id", async (req, res) => {
  try {
    const m = await prisma.bodyMeasurement.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!m) return res.status(404).json({ error: "Measurement not found" });

    await prisma.bodyMeasurement.delete({ where: { id: req.params.id } });
    res.json({ message: "Measurement deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;