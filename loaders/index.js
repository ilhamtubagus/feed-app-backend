const expressLoader = require('./express');
const mongooseLoader =  require('./mongoose');

module.exports =  async (callback) => {
    try {
        callback(await expressLoader(), mongooseLoader());
    } catch (error) {
        throw error;
    }
}