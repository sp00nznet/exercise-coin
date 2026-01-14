const Joi = require('joi');

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    username: Joi.string().alphanum().min(3).max(30).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  recordSteps: Joi.object({
    sessionId: Joi.string().required(),
    stepData: Joi.array().items(
      Joi.object({
        timestamp: Joi.date().iso().required(),
        stepCount: Joi.number().integer().min(0).required(),
        stepsPerSecond: Joi.number().min(0).max(20).required()
      })
    ).min(1).required()
  }),

  endSession: Joi.object({
    sessionId: Joi.string().required()
  }),

  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30)
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required()
  }),

  deleteAccount: Joi.object({
    password: Joi.string().required()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
};

module.exports = { validate, schemas };
