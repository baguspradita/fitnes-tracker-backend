const express = require("express");
const prisma = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

router.use(auth);
router.use(admin);

// GET platform statistics (optimized: batch queries)
router.get("/stats", async (req, res) => {
  try {
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 86400000);
    const thirtyDaysAgo = new Date(now - 30 * 86400000);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalUsers,
      totalWorkouts,
      totalExercises,
      totalSets,
      activeUsersLast7Days,
      newUsersThisMonth,
      workoutsLast7Days,
      workoutsLast30Days,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.workout.count(),
      prisma.exercise.count(),
      prisma.exerciseSet.count(),
      prisma.workout.groupBy({
        by: ["userId"],
        where: { date: { gte: sevenDaysAgo } },
      }).then((r) => r.length),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.workout.count({ where: { date: { gte: sevenDaysAgo } } }),
      prisma.workout.count({ where: { date: { gte: thirtyDaysAgo } } }),
    ]);

    // User growth per week (last 8 weeks) — single query with raw SQL
    const userGrowth = [];
    const weekRanges = [];
    for (let i = 7; i >= 0; i--) {
      const ws = new Date(now - (i + 1) * 7 * 86400000);
      const we = new Date(now - i * 7 * 86400000);
      weekRanges.push({ weekStart: ws.toISOString(), gte: ws, lt: we });
    }

    const userGrowthCounts = await Promise.all(
      weekRanges.map((w) =>
        prisma.user.count({ where: { createdAt: { gte: w.gte, lt: w.lt } } })
      )
    );
    weekRanges.forEach((w, i) => {
      userGrowth.push({ weekStart: w.weekStart, count: userGrowthCounts[i] });
    });

    // Workout activity per day (last 14 days) — parallelized
    const dayRanges = [];
    for (let i = 13; i >= 0; i--) {
      const ds = new Date(now - (i + 1) * 86400000);
      ds.setHours(0, 0, 0, 0);
      const de = new Date(ds);
      de.setHours(23, 59, 59, 999);
      dayRanges.push({ date: ds.toISOString(), gte: ds, lte: de });
    }

    const dayCounts = await Promise.all(
      dayRanges.map((d) =>
        prisma.workout.count({ where: { date: { gte: d.gte, lte: d.lte } } })
      )
    );
    const workoutActivity = dayRanges.map((d, i) => ({
      date: d.date,
      count: dayCounts[i],
    }));

    res.json({
      totalUsers,
      totalWorkouts,
      totalExercises,
      totalSets,
      activeUsersLast7Days,
      newUsersThisMonth,
      workoutsLast7Days,
      workoutsLast30Days,
      userGrowth,
      workoutActivity,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET all users with stats (with pagination cap)
router.get("/users", async (req, res) => {
  try {
    const { search, page = 1, limit = 20, role, status } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;
    if (status === "active") where.isActive = true;
    if (status === "banned") where.isActive = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              workouts: true,
              exercises: true,
              nutritionLogs: true,
              goals: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET single user detail with activity
router.get("/users/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            workouts: true,
            exercises: true,
            nutritionLogs: true,
            bodyMeasurements: true,
            goals: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const [recentWorkouts, recentNutrition, goals, latestBody] = await Promise.all([
      prisma.workout.findMany({
        where: { userId: req.params.id },
        orderBy: { date: "desc" },
        take: 10,
        include: { _count: { select: { workoutExercises: true } } },
      }),
      prisma.nutritionLog.findMany({
        where: { userId: req.params.id },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.goal.findMany({
        where: { userId: req.params.id },
        include: { exercise: { select: { name: true } } },
      }),
      prisma.bodyMeasurement.findFirst({
        where: { userId: req.params.id },
        orderBy: { date: "desc" },
      }),
    ]);

    const now = Date.now();
    const weekRanges = [];
    for (let i = 7; i >= 0; i--) {
      const ws = new Date(now - (i + 1) * 7 * 86400000);
      const we = new Date(now - i * 7 * 86400000);
      weekRanges.push({ weekStart: ws.toISOString(), gte: ws, lt: we });
    }

    const weeklyCounts = await Promise.all(
      weekRanges.map((w) =>
        prisma.workout.count({
          where: { userId: req.params.id, date: { gte: w.gte, lt: w.lt } },
        })
      )
    );
    const weeklyWorkouts = weekRanges.map((w, i) => ({
      weekStart: w.weekStart,
      count: weeklyCounts[i],
    }));

    res.json({ user, recentWorkouts, recentNutrition, goals, latestBody, weeklyWorkouts });
  } catch (err) {
    console.error("Admin user detail error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT toggle user active status / change role
router.put("/users/:id", async (req, res) => {
  try {
    const { isActive, role } = req.body;

    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Tidak bisa mengubah akun sendiri" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { role: true },
    });
    if (!targetUser) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    if (role !== undefined && !["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "Role tidak valid" });
    }

    const data = {};
    if (isActive !== undefined) data.isActive = isActive;
    if (role !== undefined) data.role = role;

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    console.log(
      `[ADMIN] User ${req.user.email} updated user ${updated.email}: ${JSON.stringify(data)}`
    );

    res.json(updated);
  } catch (err) {
    console.error("Admin update user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE user (with audit log)
router.delete("/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Tidak bisa menghapus akun sendiri" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { name: true, email: true, role: true },
    });
    if (!targetUser) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    if (targetUser.role === "ADMIN") {
      return res.status(403).json({ error: "Tidak bisa menghapus admin" });
    }

    await prisma.user.delete({ where: { id: req.params.id } });

    console.log(
      `[ADMIN] User ${req.user.email} deleted user ${targetUser.email}`
    );

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;