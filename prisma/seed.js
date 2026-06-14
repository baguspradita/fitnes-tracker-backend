const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const exercises = [
  // PUSH
  { name: "Bench Press", category: "PUSH", muscleGroup: "Chest", equipment: "Barbell" },
  { name: "Incline Bench Press", category: "PUSH", muscleGroup: "Upper Chest", equipment: "Barbell" },
  { name: "Dumbbell Press", category: "PUSH", muscleGroup: "Chest", equipment: "Dumbbell" },
  { name: "Overhead Press", category: "PUSH", muscleGroup: "Shoulders", equipment: "Barbell" },
  { name: "Dumbbell Shoulder Press", category: "PUSH", muscleGroup: "Shoulders", equipment: "Dumbbell" },
  { name: "Lateral Raise", category: "PUSH", muscleGroup: "Side Delts", equipment: "Dumbbell" },
  { name: "Tricep Pushdown", category: "PUSH", muscleGroup: "Triceps", equipment: "Cable" },
  { name: "Skull Crushers", category: "PUSH", muscleGroup: "Triceps", equipment: "Barbell" },
  { name: "Chest Fly", category: "PUSH", muscleGroup: "Chest", equipment: "Dumbbell" },
  { name: "Dips", category: "PUSH", muscleGroup: "Chest/Triceps", equipment: "Bodyweight" },
  // PULL
  { name: "Deadlift", category: "PULL", muscleGroup: "Back", equipment: "Barbell" },
  { name: "Pull Up", category: "PULL", muscleGroup: "Lats", equipment: "Bodyweight" },
  { name: "Barbell Row", category: "PULL", muscleGroup: "Back", equipment: "Barbell" },
  { name: "Dumbbell Row", category: "PULL", muscleGroup: "Back", equipment: "Dumbbell" },
  { name: "Lat Pulldown", category: "PULL", muscleGroup: "Lats", equipment: "Cable" },
  { name: "Seated Cable Row", category: "PULL", muscleGroup: "Back", equipment: "Cable" },
  { name: "Face Pull", category: "PULL", muscleGroup: "Rear Delts", equipment: "Cable" },
  { name: "Barbell Curl", category: "PULL", muscleGroup: "Biceps", equipment: "Barbell" },
  { name: "Dumbbell Curl", category: "PULL", muscleGroup: "Biceps", equipment: "Dumbbell" },
  { name: "Hammer Curl", category: "PULL", muscleGroup: "Biceps", equipment: "Dumbbell" },
  // LEGS
  { name: "Squat", category: "LEGS", muscleGroup: "Quads", equipment: "Barbell" },
  { name: "Front Squat", category: "LEGS", muscleGroup: "Quads", equipment: "Barbell" },
  { name: "Leg Press", category: "LEGS", muscleGroup: "Quads", equipment: "Machine" },
  { name: "Romanian Deadlift", category: "LEGS", muscleGroup: "Hamstrings", equipment: "Barbell" },
  { name: "Leg Curl", category: "LEGS", muscleGroup: "Hamstrings", equipment: "Machine" },
  { name: "Leg Extension", category: "LEGS", muscleGroup: "Quads", equipment: "Machine" },
  { name: "Calf Raise", category: "LEGS", muscleGroup: "Calves", equipment: "Machine" },
  { name: "Bulgarian Split Squat", category: "LEGS", muscleGroup: "Quads", equipment: "Dumbbell" },
  { name: "Hip Thrust", category: "LEGS", muscleGroup: "Glutes", equipment: "Barbell" },
  { name: "Lunges", category: "LEGS", muscleGroup: "Quads/Glutes", equipment: "Dumbbell" },
  // CORE
  { name: "Plank", category: "CORE", muscleGroup: "Abs", equipment: "Bodyweight" },
  { name: "Hanging Leg Raise", category: "CORE", muscleGroup: "Abs", equipment: "Bodyweight" },
  { name: "Cable Crunch", category: "CORE", muscleGroup: "Abs", equipment: "Cable" },
  { name: "Ab Rollout", category: "CORE", muscleGroup: "Abs", equipment: "Ab Wheel" },
  // CARDIO
  { name: "Treadmill Run", category: "CARDIO", muscleGroup: "Full Body", equipment: "Treadmill" },
  { name: "Cycling", category: "CARDIO", muscleGroup: "Legs", equipment: "Bike" },
  { name: "Rowing Machine", category: "CARDIO", muscleGroup: "Full Body", equipment: "Rowing Machine" },
  { name: "Jump Rope", category: "CARDIO", muscleGroup: "Full Body", equipment: "Jump Rope" },
  // FULL BODY
  { name: "Clean and Press", category: "FULL_BODY", muscleGroup: "Full Body", equipment: "Barbell" },
  { name: "Kettlebell Swing", category: "FULL_BODY", muscleGroup: "Full Body", equipment: "Kettlebell" },
  { name: "Burpees", category: "FULL_BODY", muscleGroup: "Full Body", equipment: "Bodyweight" },
];

async function main() {
  console.log("Seeding exercises...");

  for (const ex of exercises) {
    await prisma.exercise.create({
      data: { ...ex, isCustom: false },
    });
  }

  console.log(`Seeded ${exercises.length} exercises!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });