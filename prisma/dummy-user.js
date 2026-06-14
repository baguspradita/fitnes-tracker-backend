const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

// Helper: random int between min and max (inclusive)
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// Helper: random float
const randFloat = (min, max, dec = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(dec));
// Helper: random pick from array
const pick = (arr) => arr[randInt(0, arr.length - 1)];
// Helper: days ago from today
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

// Workout templates: [exerciseName, baseWeight, weightIncrement, repRange, sets]
const TEMPLATES = {
  "Push Day A": [
    { exercise: "Bench Press", base: 50, increment: 20, reps: [6, 8], sets: 4 },
    { exercise: "Incline Bench Press", base: 35, increment: 12.5, reps: [8, 10], sets: 3 },
    { exercise: "Overhead Press", base: 30, increment: 10, reps: [6, 8], sets: 3 },
    { exercise: "Lateral Raise", base: 8, increment: 4, reps: [12, 15], sets: 3 },
    { exercise: "Tricep Pushdown", base: 15, increment: 7.5, reps: [10, 12], sets: 3 },
  ],
  "Push Day B": [
    { exercise: "Dumbbell Press", base: 20, increment: 8, reps: [8, 10], sets: 4 },
    { exercise: "Dumbbell Shoulder Press", base: 14, increment: 6, reps: [8, 10], sets: 3 },
    { exercise: "Chest Fly", base: 10, increment: 4, reps: [12, 15], sets: 3 },
    { exercise: "Skull Crushers", base: 15, increment: 5, reps: [10, 12], sets: 3 },
    { exercise: "Dips", base: 0, increment: 10, reps: [8, 12], sets: 3 },
  ],
  "Pull Day A": [
    { exercise: "Deadlift", base: 70, increment: 30, reps: [4, 6], sets: 4 },
    { exercise: "Barbell Row", base: 40, increment: 15, reps: [8, 10], sets: 4 },
    { exercise: "Pull Up", base: 0, increment: 10, reps: [6, 10], sets: 3 },
    { exercise: "Face Pull", base: 12, increment: 5, reps: [15, 18], sets: 3 },
    { exercise: "Barbell Curl", base: 15, increment: 5, reps: [10, 12], sets: 3 },
  ],
  "Pull Day B": [
    { exercise: "Lat Pulldown", base: 35, increment: 12.5, reps: [10, 12], sets: 4 },
    { exercise: "Seated Cable Row", base: 35, increment: 10, reps: [10, 12], sets: 3 },
    { exercise: "Dumbbell Row", base: 18, increment: 8, reps: [10, 12], sets: 3 },
    { exercise: "Hammer Curl", base: 10, increment: 4, reps: [10, 12], sets: 3 },
    { exercise: "Dumbbell Curl", base: 8, increment: 4, reps: [12, 15], sets: 3 },
  ],
  "Legs Day A": [
    { exercise: "Squat", base: 60, increment: 30, reps: [5, 8], sets: 4 },
    { exercise: "Leg Press", base: 80, increment: 30, reps: [10, 12], sets: 3 },
    { exercise: "Romanian Deadlift", base: 40, increment: 15, reps: [8, 10], sets: 3 },
    { exercise: "Leg Curl", base: 20, increment: 7.5, reps: [10, 12], sets: 3 },
    { exercise: "Calf Raise", base: 30, increment: 10, reps: [15, 20], sets: 4 },
  ],
  "Legs Day B": [
    { exercise: "Front Squat", base: 40, increment: 15, reps: [6, 8], sets: 4 },
    { exercise: "Bulgarian Split Squat", base: 10, increment: 6, reps: [10, 12], sets: 3 },
    { exercise: "Hip Thrust", base: 40, increment: 20, reps: [8, 10], sets: 3 },
    { exercise: "Leg Extension", base: 20, increment: 7.5, reps: [12, 15], sets: 3 },
    { exercise: "Lunges", base: 10, increment: 6, reps: [10, 12], sets: 3 },
  ],
};

const WORKOUT_NAMES = Object.keys(TEMPLATES);

const FOODS = {
  BREAKFAST: [
    { name: "Oatmeal + Pisang + Madu", cal: 380, p: 12, c: 65, f: 8 },
    { name: "Telur Orak-arik + Roti Gandum", cal: 420, p: 22, c: 38, f: 18 },
    { name: "Smoothie Protein (Whey + Susu + Berry)", cal: 350, p: 30, c: 40, f: 6 },
    { name: "Nasi Uduk + Telur Dadar", cal: 450, p: 18, c: 55, f: 16 },
    { name: "Greek Yogurt + Granola", cal: 320, p: 20, c: 35, f: 12 },
  ],
  LUNCH: [
    { name: "Nasi + Ayam Bakar + Sayur", cal: 620, p: 42, c: 70, f: 18 },
    { name: "Nasi + Ikan Goreng + Tempe", cal: 680, p: 38, c: 75, f: 22 },
    { name: "Nasi + Daging Sapi + Brokoli", cal: 650, p: 40, c: 68, f: 20 },
    { name: "Mie Ayam + Pangsit", cal: 580, p: 25, c: 72, f: 20 },
    { name: "Nasi Goreng + Telur", cal: 550, p: 20, c: 65, f: 22 },
  ],
  DINNER: [
    { name: "Nasi + Ayam Geprek", cal: 580, p: 35, c: 65, f: 20 },
    { name: "Nasi + Telur + Tumis Kangkung", cal: 480, p: 28, c: 55, f: 15 },
    { name: "Pasta Bolognese", cal: 550, p: 30, c: 62, f: 18 },
    { name: "Nasi + Ikan Bakar + Lalapan", cal: 520, p: 38, c: 58, f: 14 },
    { name: "Soto Ayam + Nasi", cal: 500, p: 28, c: 60, f: 16 },
  ],
  SNACK: [
    { name: "Protein Shake", cal: 180, p: 25, c: 10, f: 3 },
    { name: "Pisang + Selai Kacang", cal: 220, p: 6, c: 30, f: 10 },
    { name: "Kacang Almond 30g", cal: 170, p: 6, c: 6, f: 15 },
    { name: "Roti + Selai Kacang", cal: 250, p: 8, c: 32, f: 12 },
    { name: "Buah Potong + Yogurt", cal: 150, p: 8, c: 22, f: 3 },
  ],
};

const BODY_NOTES = [
  "Push Day — fokus progressive overload bench press",
  "Pull Day — deadlift PR attempt",
  "Legs Day — squat depth improvement",
  "Upper body focus hari ini",
  "Sesi ringan, recovery week",
  "Full intensity session",
  "Deload week — kurangi volume",
  "Push Day — incline bench baru naik 2.5kg",
  "Pull Day — lat pulldown naik pelat",
  "Legs Day — tambah set di leg press",
];

async function main() {
  console.log("🚀 Creating dummy user with 1 year of data...\n");

  // 1. Create user
  const password = await bcrypt.hash("123456", 12);
  const user = await prisma.user.upsert({
    where: { email: "dummy@fittrack.com" },
    update: { name: "Rian Fitness", password },
    create: {
      name: "Rian Fitness",
      email: "dummy@fittrack.com",
      password,
    },
  });
  console.log(`✅ User: ${user.name} (${user.email}) | pass: 123456\n`);

  // Get all exercises from DB (already seeded)
  const allExercises = await prisma.exercise.findMany();
  const findExercise = (name) => allExercises.find((e) => e.name === name);

  // 2. Generate 1 year of workouts (~3-4x per week = ~170 workouts)
  console.log("📋 Generating workouts...");
  const workoutDates = [];
  const oneYearAgo = 365;

  // Generate workout dates: 3-4x per week for 52 weeks
  for (let week = 0; week < 52; week++) {
    const daysThisWeek = randInt(3, 4);
    const availableDays = [0, 1, 2, 3, 4, 5, 6];
    for (let d = 0; d < daysThisWeek; d++) {
      const idx = randInt(0, availableDays.length - 1);
      const dayOffset = availableDays.splice(idx, 1)[0];
      const daysBack = oneYearAgo - (week * 7 + dayOffset);
      if (daysBack > 0) {
        workoutDates.push(daysBack);
      }
    }
  }
  workoutDates.sort((a, b) => b - a); // oldest first

  let workoutCount = 0;
  let totalSets = 0;

  for (let i = 0; i < workoutDates.length; i++) {
    const daysBack = workoutDates[i];
    const progressFactor = 1 - daysBack / oneYearAgo; // 0 = start, 1 = now
    const workoutName = pick(WORKOUT_NAMES);
    const template = TEMPLATES[workoutName];

    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        name: workoutName,
        notes: pick(BODY_NOTES),
        date: daysAgo(daysBack),
        durationMin: randInt(45, 90),
        completed: true,
      },
    });

    // Add 3-5 exercises per workout
    const numExercises = randInt(3, Math.min(5, template.length));
    const selectedExercises = template.slice(0, numExercises);

    for (let ei = 0; ei < selectedExercises.length; ei++) {
      const t = selectedExercises[ei];
      const exercise = findExercise(t.exercise);
      if (!exercise) continue;

      const we = await prisma.workoutExercise.create({
        data: {
          workoutId: workout.id,
          exerciseId: exercise.id,
          sortOrder: ei,
        },
      });

      // Generate sets
      const numSets = t.sets + (Math.random() > 0.7 ? 1 : 0);
      const currentWeight = t.base + t.increment * progressFactor;

      // Warmup sets first
      if (t.base > 0) {
        const warmupReps = randInt(8, 12);
        const warmupWeight = parseFloat((currentWeight * 0.5).toFixed(2));
        await prisma.exerciseSet.create({
          data: {
            workoutExerciseId: we.id,
            setNumber: 1,
            reps: warmupReps,
            weightKg: warmupWeight,
            isWarmup: true,
            completed: true,
          },
        });
        totalSets++;
      }

      // Working sets
      for (let s = 0; s < numSets; s++) {
        const reps = randInt(t.reps[0], t.reps[1]);
        const weightVariation = randFloat(-2.5, 2.5, 2);
        const weight = Math.max(0, parseFloat((currentWeight + weightVariation).toFixed(2)));
        const rpe = randFloat(6.5, 9.5, 1);

        await prisma.exerciseSet.create({
          data: {
            workoutExerciseId: we.id,
            setNumber: t.base > 0 ? s + 2 : s + 1,
            reps,
            weightKg: weight > 0 ? weight : null,
            rpe,
            isWarmup: false,
            completed: true,
          },
        });
        totalSets++;
      }
    }
    workoutCount++;
  }
  console.log(`   ${workoutCount} workouts, ${totalSets} sets\n`);

  // 3. Generate body measurements (weekly for 52 weeks)
  console.log("📏 Generating body measurements...");
  let measurementCount = 0;
  for (let week = 0; week < 52; week++) {
    const daysBack = oneYearAgo - week * 7;
    if (daysBack < 0) break;
    const progressFactor = 1 - daysBack / oneYearAgo;

    // Weight: 75kg → 72kg (lost fat, gained muscle)
    const weight = 75 - 3 * progressFactor + randFloat(-0.3, 0.3, 1);
    // Body fat: 22% → 16%
    const bodyFat = 22 - 6 * progressFactor + randFloat(-0.3, 0.3, 1);
    // Muscle mass: 32kg → 35kg
    const muscle = 32 + 3 * progressFactor + randFloat(-0.2, 0.2, 1);
    // Waist: 84cm → 78cm
    const waist = 84 - 6 * progressFactor + randFloat(-0.5, 0.5, 1);

    await prisma.bodyMeasurement.create({
      data: {
        userId: user.id,
        date: daysAgo(daysBack),
        weightKg: weight,
        bodyFatPct: Math.max(8, bodyFat),
        muscleMassKg: muscle,
        waistCm: Math.max(70, waist),
      },
    });
    measurementCount++;
  }
  console.log(`   ${measurementCount} measurements\n`);

  // 4. Generate nutrition logs (5 days per week for ~30 weeks = ~150 days, 2-4 meals each)
  console.log("🍽️ Generating nutrition logs...");
  let nutritionCount = 0;
  for (let d = 0; d < 200; d++) {
    const daysBack = randInt(0, 300);
    const meals = ["BREAKFAST", "LUNCH", "DINNER"];
    if (Math.random() > 0.5) meals.push("SNACK");

    for (const meal of meals) {
      const food = pick(FOODS[meal]);
      await prisma.nutritionLog.create({
        data: {
          userId: user.id,
          date: daysAgo(daysBack),
          mealType: meal,
          foodName: food.name,
          calories: food.cal + randInt(-30, 30),
          proteinG: parseFloat((food.p + randFloat(-2, 2, 1)).toFixed(2)),
          carbsG: parseFloat((food.c + randFloat(-5, 5, 1)).toFixed(2)),
          fatG: parseFloat((food.f + randFloat(-2, 2, 1)).toFixed(2)),
          servingQty: 1,
        },
      });
      nutritionCount++;
    }
  }
  console.log(`   ${nutritionCount} nutrition logs\n`);

  // 5. Generate goals
  console.log("🎯 Generating goals...");
  const benchPress = findExercise("Bench Press");
  const squat = findExercise("Squat");
  const deadlift = findExercise("Deadlift");

  const goals = [
    {
      type: "WEIGHT",
      targetValue: 72,
      currentValue: 72.3,
      deadline: daysAgo(-30),
      achieved: true,
    },
    {
      type: "BODY_FAT",
      targetValue: 15,
      currentValue: 16.2,
      deadline: daysAgo(-60),
      achieved: false,
    },
    {
      type: "STRENGTH",
      targetValue: 80,
      currentValue: 72.5,
      exerciseId: benchPress?.id,
      deadline: daysAgo(-90),
      achieved: false,
    },
    {
      type: "STRENGTH",
      targetValue: 100,
      currentValue: 82.5,
      exerciseId: squat?.id,
      deadline: daysAgo(-60),
      achieved: false,
    },
    {
      type: "STRENGTH",
      targetValue: 120,
      currentValue: 125,
      exerciseId: deadlift?.id,
      deadline: daysAgo(-10),
      achieved: true,
    },
    {
      type: "CUSTOM",
      targetValue: 150,
      currentValue: 142,
      deadline: daysAgo(-45),
      achieved: false,
    },
  ];

  for (const g of goals) {
    await prisma.goal.create({
      data: {
        userId: user.id,
        type: g.type,
        targetValue: g.targetValue,
        currentValue: g.currentValue,
        exerciseId: g.exerciseId || null,
        deadline: g.deadline,
        achieved: g.achieved,
      },
    });
  }
  console.log(`   ${goals.length} goals created\n`);

  console.log("══════════════════════════════════════════");
  console.log("🎉 DUMMY USER BERHASIL DIBUAT!");
  console.log("══════════════════════════════════════════");
  console.log(`   Login: dummy@fittrack.com`);
  console.log(`   Pass:  123456`);
  console.log(`   Workouts: ${workoutCount}`);
  console.log(`   Sets: ${totalSets}`);
  console.log(`   Measurements: ${measurementCount}`);
  console.log(`   Nutrition logs: ${nutritionCount}`);
  console.log(`   Goals: ${goals.length}`);
  console.log("══════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });