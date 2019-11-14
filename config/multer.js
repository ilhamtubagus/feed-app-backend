const path = require('path');
const multer = require('multer');
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../storage/images/upload'));
    },
    filename: (req, file, cb) => {
        let extension = file.originalname.split('.');
        extension = extension[extension.length-1]; // get file extension
        let filename = file.originalname.toLowerCase().split('.')[0];
        filename = filename.replace(/[^\w]/g, ''); // replace any characters except alphanumeric
        cb(null, Math.floor(Date.now() / 1000)+ '-' + filename.replace(/\s/g, '-') + '.' + extension);
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};
const limit = {
    fileSize: 3 * 1024 * 1024// 3MB
}
exports.fileStorageOptions = fileStorage;
exports.fileFilterOptions = fileFilter;
exports.limits = limit;