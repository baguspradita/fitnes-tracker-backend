const Joi = require("joi");

const createGoalSchema = Joi.object({
  type: Joi.string().valid("WEIGHT", "STRENGTH", "BODY_FAT", "CUSTOM").required(),
  targetValue: Joi.number().required(),
  exerciseId: Joi.string().allow(null),
  deadline: Joi.date().iso().allow(null),
});

const updateGoalSchema = Joi.object({
  targetValue: Joi.number(),
  exerciseId: Joi.string().allow(null),
  deadline: Joi.date().iso().allow(null),
  achieved: Joi.boolean(),
});

module.exports = { createGoalSchema, updateGoalSchema };