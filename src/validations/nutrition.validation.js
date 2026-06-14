const Joi = require("joi");

const createNutritionSchema = Joi.object({
  date: Joi.date().iso(),
  mealType: Joi.string().valid("BREAKFAST", "LUNCH", "DINNER", "SNACK").required(),
  foodName: Joi.string().min(1).max(200).required(),
  calories: Joi.number().integer().min(0).required(),
  proteinG: Joi.number().min(0).required(),
  carbsG: Joi.number().min(0).required(),
  fatG: Joi.number().min(0).required(),
  servingQty: Joi.number().min(0.01),
});

const updateNutritionSchema = Joi.object({
  mealType: Joi.string().valid("BREAKFAST", "LUNCH", "DINNER", "SNACK"),
  foodName: Joi.string().min(1).max(200),
  calories: Joi.number().integer().min(0),
  proteinG: Joi.number().min(0),
  carbsG: Joi.number().min(0),
  fatG: Joi.number().min(0),
  servingQty: Joi.number().min(0.01),
});

module.exports = { createNutritionSchema, updateNutritionSchema };