const express = require('express');
const authControllers = require('../controllers/auth');
const { body } = require('express-validator');
const User = require('../model/user');
const router = express.Router();

router.post('/login', authControllers.login);

router.put('/signup', [
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .custom((value, { req }) => {
        return User.findOne({email: value}).then(user => {
            if (user) {
                return Promise.reject('Email address already exists');
            }
        });
    })
    .normalizeEmail(),
    body('password').trim().isLength({ min: 8 , max: 20}),
    body('name').trim().not().isEmpty()
], authControllers.signup);

router.post('/refresh-token', authControllers.refreshToken);

module.exports = router;