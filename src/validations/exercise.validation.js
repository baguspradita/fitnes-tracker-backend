const Joi = require("joi");

const createExerciseSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow("", null),
  category: Joi.string()
    .valid("PUSH", "PULL", "LEGS", "CORE", "CARDIO", "FULL_BODY")
    .required(),
  muscleGroup: Joi.string().max(50).required(),
  equipment: Joi.string().max(50).allow("", null),
});

const updateExerciseSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().allow("", null),
  category: Joi.string().valid("PUSH", "PULL", "LEGS", "CORE", "CARDIO", "FULL_BODY"),
  muscleGroup: Joi.string().max(50),
  equipment: Joi.string().max(50).allow("", null),
});

module.exports = { createExerciseSchema, updateExerciseSchema };