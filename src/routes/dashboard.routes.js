const express = require("express");
const prisma = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

// GET dashboard summary
router.get("/summary", async (req, res) => {
  try {
    const userId = req.user.id;

    // Total workouts
    const totalWorkouts = await prisma.workout.count({
      where: { userId, completed: true },
    });

    // Streak calculation
    const workouts = await prisma.workout.findMany({
      where: { userId, completed: true },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    let streak = 0;
    if (workouts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);

      for (const w of workouts) {
        const wDate = new Date(w.date);
        wDate.setHours(0, 0, 0, 0);

        if (wDate.getTime() === checkDate.getTime()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (wDate.getTime() < checkDate.getTime()) {
          if (checkDate.getTime() === today.getTime()) {
            checkDate.setDate(checkDate.getDate() - 1);
            if (wDate.getTime() === checkDate.getTime()) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }
    }

    // Total volume this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekWorkouts = await prisma.workout.findMany({
      where: { userId, completed: true, date: { gte: weekStart } },
      include: {
        workoutExercises: {
          include: { sets: { where: { isWarmup: false } } },
        },
      },
    });

    let weeklyVolume = 0;
    for (const w of weekWorkouts) {
      for (const we of w.workoutExercises) {
        for (const s of we.sets) {
          weeklyVolume += s.reps * (parseFloat(s.weightKg) || 0);
        }
      }
    }

    // Personal records (top 5 by estimated 1RM)
    const allSets = await prisma.exerciseSet.findMany({
      where: {
        isWarmup: false,
        weightKg: { not: null },
        workoutExercise: { workout: { userId } },
      },
      include: {
        workoutExercise: { include: { exercise: { select: { name: true } } } },
      },
    });

    const prs = {};
    for (const s of allSets) {
      const name = s.workoutExercise.exercise.name;
      const e1RM = parseFloat(s.weightKg) * (1 + s.reps / 30);
      if (!prs[name] || e1RM > prs[name].e1RM) {
        prs[name] = { e1RM: Math.round(e1RM * 10) / 10, weightKg: parseFloat(s.weightKg), reps: s.reps };
      }
    }

    const topPRs = Object.entries(prs)
      .sort((a, b) => b[1].e1RM - a[1].e1RM)
      .slice(0, 5)
      .map(([name, data]) => ({ exercise: name, ...data }));

    res.json({
      totalWorkouts,
      streak,
      weeklyVolume: Math.round(weeklyVolume * 10) / 10,
      personalRecords: topPRs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET weekly volume (last 8 weeks)
router.get("/volume", async (req, res) => {
  try {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const workouts = await prisma.workout.findMany({
        where: { userId: req.user.id, completed: true, date: { gte: start, lte: end } },
        include: {
          workoutExercises: { include: { sets: { where: { isWarmup: false } } } },
        },
      });

      let volume = 0;
      for (const w of workouts) {
        for (const we of w.workoutExercises) {
          for (const s of we.sets) {
            volume += s.reps * (parseFloat(s.weightKg) || 0);
          }
        }
      }

      weeks.push({
        weekStart: start.toISOString().split("T")[0],
        volume: Math.round(volume * 10) / 10,
      });
    }
    res.json(weeks);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET strength progression for an exercise
router.get("/strength/:exerciseId", async (req, res) => {
  try {
    const sets = await prisma.exerciseSet.findMany({
      where: {
        workoutExercise: {
          exerciseId: req.params.exerciseId,
          workout: { userId: req.user.id, completed: true },
        },
        isWarmup: false,
        weightKg: { not: null },
      },
      include: {
        workoutExercise: {
          include: { workout: { select: { date: true } } },
        },
      },
      orderBy: { workoutExercise: { workout: { date: "asc" } } },
    });

    const progression = sets.map((s) => ({
      date: s.workoutExercise.workout.date,
      weightKg: parseFloat(s.weightKg),
      reps: s.reps,
      e1RM: Math.round(parseFloat(s.weightKg) * (1 + s.reps / 30) * 10) / 10,
    }));

    res.json(progression);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;