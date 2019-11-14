const events = require('./events');
const emitter = require('./emitter');

const compressImage = require('../services/compressImage');

emitter.on(events.feed.postImage, compressImage)

module.exports = emitter;