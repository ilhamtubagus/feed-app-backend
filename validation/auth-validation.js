const Joi = require('@hapi/joi');

function validateLoginPost(user) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(20).required(),
    });
    return schema.validate(user, { abortEarly: false});
}
exports.validateLoginPost  = validateLoginPost;