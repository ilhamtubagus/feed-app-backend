const mongoose = require('mongoose');

module.exports = async () => {
    mongoose
        .connect(process.env.DB_CONNECTION, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .then(connection => {
            return connection.connection.db;
        })
        .catch(err => {
            console.log(err);
        });
}