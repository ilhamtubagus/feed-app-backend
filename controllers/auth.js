const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../model/user');
const {
  validationResult
} = require('express-validator');
const {
  validateLoginPost
} = require('../validation/auth-validation');

exports.signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  bcrypt.hash(password, 12)
    .then(hashedPw => {
      const user = new User({
        email: email,
        password: hashedPw,
        name: name
      });
      return user.save();
    })
    .then(result => {
      res.status(201).json({
        message: 'User created!',
        userId: result._id
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}

exports.login = (req, res, next) => {
  const {
    error
  } = validateLoginPost(req.body);
  if (error) {
    const message = error.details.map(i => {
      return i.message;
    });
    const errors = new Error('Validation failed');
    errors.statusCode = 422;
    errors.data = message;
    throw errors;
  }
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({
      email: email
    })
    .then(user => {
      if (!user) {
        const error = new Error('User with this email address could not be found');
        error.statusCode = 404;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, loadedUser.password);
    })
    .then(isEqual => {
      if (!isEqual) {
        const error = new Error('Wrong password');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign({
        email: loadedUser.email,
        userId: loadedUser._id.toString()
      }, process.env.JWT_SECRET, {
        expiresIn: process.env.tokenLife,
        notBefore: "3000"
      });
      return res.status(200).json({
        token: token,
        expiresIn: process.env.tokenLife,
        userId: loadedUser._id.toString(),

      });
    })
    .catch(err => {
      console.log(err);
      if (!err) {
        err.statusCode = 500;
      }
      next(err);
    });
}

exports.refreshToken = (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    const error = new Error('Authentication failed');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      error.statusCode = 401;
      error.message = "Token expired";
      throw error;
    }
    error.statusCode = 500;
    throw error;
  }

  const nowUnixSeconds = Math.round(Number(new Date()) / 1000)
  // New token will only be issued if the old token is within 24 hour of expiry.
  if (decodedToken.exp - nowUnixSeconds > 86400) {
    return res.status(400).json({
      message: "Could not refresh token yet"
    }).end();
  }
  const newToken = jwt.sign({
    email: decodedToken.email,
    userId: decodedToken.userId
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.tokenLife,
    notBefore: "3000"
  });
  return res.status(200).json({
    token: newToken,
    expiresIn: process.env.tokenLife,
    userId: decodedToken.userId,
  });

}