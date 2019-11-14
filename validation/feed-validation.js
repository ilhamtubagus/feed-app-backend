const Joi = require('@hapi/joi');

function validateFeedPost(feed) {
    const schema = Joi.object({
        title: Joi.string().min(5).max(50).required(),
        content: Joi.string().min(5).max(50).required(),
        image: Joi.string()
    });
    return schema.validate(feed, { abortEarly: false});
}

exports.validateFeedPost = validateFeedPost;