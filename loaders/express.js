const path = require('path');

const multer = require('multer');
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');

const feedRoutes = require('../routes/feed');
const authRoutes = require('../routes/auth');

const app = express();

module.exports = async () => {
    app.use(compression());
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use('/images', express.static(path.join(__dirname, '../images')));

    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
    });
    app.use('/feed', feedRoutes);
    app.use('/auth', authRoutes);

    app.use((error, req, res, next) => {
        let status;
        if (error instanceof multer.MulterError) {
            status = 422;
        }else{
            status = error.statusCode || 500 ;
        }
        const message = error.message;
        const data = error.data;
        res.status(status).json({
            message: message,
            data: data
        });
    })

    return app;
}