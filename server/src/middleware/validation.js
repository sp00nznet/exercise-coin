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
        stepsPerSecond: Joi.number().min(0).max(20).required(),
        accelVariance: Joi.number().min(0)
      })
    ).min(1).required()
  }),

  startSession: Joi.object({
    source: Joi.string().lowercase().pattern(/^[a-z0-9_-]{1,16}$/).allow('', null),
    consoleHash: Joi.string().pattern(/^[0-9a-fA-F]{16}$/)
  }),

  pedometerSync: Joi.object({
    consoleHash: Joi.string().pattern(/^[0-9a-fA-F]{16}$/).required(),
    clientNow: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/).required(),
    totalSteps: Joi.number().integer().min(0).required(),
    hours: Joi.array().items(
      Joi.object({
        start: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:00:00$/).required(),
        steps: Joi.number().integer().min(0).max(65535).required()
      })
    ).min(1).max(168).required()
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

// assign: replace req.body with the validated (stripped/converted) value.
// Off by default so existing routes keep their behaviour.
const validate = (schema, { assign = false } = {}) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body || {}, {
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

    if (assign) req.body = value;
    next();
  };
};

module.exports = { validate, schemas };
