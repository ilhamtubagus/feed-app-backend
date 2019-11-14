const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
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
        error.statusCode =  500;
        throw error;
    }

    if (!decodedToken) {
        const error = new Error('Authentication failed');
        error.statusCode = 401;
        throw error;
    }

    req.userId = decodedToken.userId;
    next();
}