const Joi = require("joi");

const createBodySchema = Joi.object({
  date: Joi.date().iso(),
  weightKg: Joi.number().min(20).max(300).precision(2).required(),
  bodyFatPct: Joi.number().min(1).max(60).precision(1).allow(null),
  muscleMassKg: Joi.number().min(10).max(200).precision(2).allow(null),
  waistCm: Joi.number().min(30).max(200).precision(1).allow(null),
});

const updateBodySchema = Joi.object({
  weightKg: Joi.number().min(20).max(300).precision(2),
  bodyFatPct: Joi.number().min(1).max(60).precision(1).allow(null),
  muscleMassKg: Joi.number().min(10).max(200).precision(2).allow(null),
  waistCm: Joi.number().min(30).max(200).precision(1).allow(null),
});

module.exports = { createBodySchema, updateBodySchema };