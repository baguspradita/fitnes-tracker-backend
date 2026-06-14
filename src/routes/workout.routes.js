const express = require("express");
const prisma = require("../config/db");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createWorkoutSchema,
  updateWorkoutSchema,
  addExerciseToWorkoutSchema,
  addSetSchema,
  updateSetSchema,
} = require("../validations/workout.validation");

const router = express.Router();

router.use(auth);

// GET all workouts
router.get("/", async (req, res) => {
  try {
    const workouts = await prisma.workout.findMany({
      where: { userId: req.user.id },
      orderBy: { date: "desc" },
      include: {
        workoutExercises: {
          include: { exercise: true, _count: { select: { sets: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    res.json(workouts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET single workout
router.get("/:id", async (req, res) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: "asc" } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!workout) return res.status(404).json({ error: "Workout not found" });
    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST create workout
router.post("/", validate(createWorkoutSchema), async (req, res) => {
  try {
    const workout = await prisma.workout.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json(workout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update workout
router.put("/:id", validate(updateWorkoutSchema), async (req, res) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!workout) return res.status(404).json({ error: "Workout not found" });

    const updated = await prisma.workout.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE workout
router.delete("/:id", async (req, res) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!workout) return res.status(404).json({ error: "Workout not found" });

    await prisma.workout.delete({ where: { id: req.params.id } });
    res.json({ message: "Workout deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST add exercise to workout
router.post("/:id/exercises", validate(addExerciseToWorkoutSchema), async (req, res) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!workout) return res.status(404).json({ error: "Workout not found" });

    const maxOrder = await prisma.workoutExercise.aggregate({
      where: { workoutId: req.params.id },
      _max: { sortOrder: true },
    });

    const we = await prisma.workoutExercise.create({
      data: {
        workoutId: req.params.id,
        exerciseId: req.body.exerciseId,
        sortOrder: req.body.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
        notes: req.body.notes,
      },
      include: { exercise: true },
    });
    res.status(201).json(we);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE exercise from workout
router.delete("/:workoutId/exercises/:weId", async (req, res) => {
  try {
    await prisma.workoutExercise.delete({
      where: { id: req.params.weId, workoutId: req.params.workoutId },
    });
    res.json({ message: "Exercise removed from workout" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST add set to workout exercise
router.post("/exercises/:weId/sets", validate(addSetSchema), async (req, res) => {
  try {
    const maxSet = await prisma.exerciseSet.aggregate({
      where: { workoutExerciseId: req.params.weId },
      _max: { setNumber: true },
    });

    const set = await prisma.exerciseSet.create({
      data: {
        workoutExerciseId: req.params.weId,
        setNumber: (maxSet._max.setNumber ?? 0) + 1,
        reps: req.body.reps,
        weightKg: req.body.weightKg ? parseFloat(req.body.weightKg) : null,
        rpe: req.body.rpe ? parseFloat(req.body.rpe) : null,
        isWarmup: req.body.isWarmup ?? false,
      },
    });

    // PR detection
    if (!set.isWarmup && set.weightKg && set.reps) {
      const e1RM = parseFloat(set.weightKg) * (1 + set.reps / 30);
      const we = await prisma.workoutExercise.findUnique({
        where: { id: req.params.weId },
        select: { exerciseId: true },
      });

      const allSets = await prisma.exerciseSet.findMany({
        where: {
          workoutExercise: { exerciseId: we.exerciseId },
          isWarmup: false,
          weightKg: { not: null },
          NOT: { id: set.id },
        },
      });

      let bestE1RM = 0;
      for (const s of allSets) {
        const e = parseFloat(s.weightKg) * (1 + s.reps / 30);
        if (e > bestE1RM) bestE1RM = e;
      }

      if (e1RM > bestE1RM) {
        set.isPR = true;
      }
    }

    res.status(201).json(set);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update set
router.put("/sets/:setId", validate(updateSetSchema), async (req, res) => {
  try {
    const updated = await prisma.exerciseSet.update({
      where: { id: req.params.setId },
      data: {
        ...req.body,
        weightKg: req.body.weightKg !== undefined ? (req.body.weightKg ? parseFloat(req.body.weightKg) : null) : undefined,
        rpe: req.body.rpe !== undefined ? (req.body.rpe ? parseFloat(req.body.rpe) : null) : undefined,
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE set
router.delete("/sets/:setId", async (req, res) => {
  try {
    await prisma.exerciseSet.delete({ where: { id: req.params.setId } });
    res.json({ message: "Set deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;