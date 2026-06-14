require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/workouts", require("./routes/workout.routes"));
app.use("/api/exercises", require("./routes/exercise.routes"));
app.use("/api/nutrition", require("./routes/nutrition.routes"));
app.use("/api/body", require("./routes/body.routes"));
app.use("/api/goals", require("./routes/goal.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/settings", require("./routes/settings.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});