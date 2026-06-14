const Joi = require("joi");

const createWorkoutSchema = Joi.object({
  name: Joi.string().max(100).allow("", null),
  notes: Joi.string().allow("", null),
  date: Joi.date().iso(),
});

const updateWorkoutSchema = Joi.object({
  name: Joi.string().max(100).allow("", null),
  notes: Joi.string().allow("", null),
  date: Joi.date().iso(),
  durationMin: Joi.number().integer().min(0).allow(null),
  completed: Joi.boolean(),
});

const addExerciseToWorkoutSchema = Joi.object({
  exerciseId: Joi.string().required(),
  sortOrder: Joi.number().integer().min(0),
  notes: Joi.string().allow("", null),
});

const addSetSchema = Joi.object({
  reps: Joi.number().integer().min(1).required(),
  weightKg: Joi.number().min(0).allow(null),
  rpe: Joi.number().min(1).max(10).precision(1).allow(null),
  isWarmup: Joi.boolean(),
});

const updateSetSchema = Joi.object({
  reps: Joi.number().integer().min(1),
  weightKg: Joi.number().min(0).allow(null),
  rpe: Joi.number().min(1).max(10).precision(1).allow(null),
  isWarmup: Joi.boolean(),
  completed: Joi.boolean(),
});

module.exports = {
  createWorkoutSchema,
  updateWorkoutSchema,
  addExerciseToWorkoutSchema,
  addSetSchema,
  updateSetSchema,
};