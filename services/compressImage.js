const fs = require('fs');

const imagemin = require('imagemin');
const imageminOptipng = require('imagemin-optipng');
const imageminMozjpeg = require('imagemin-mozjpeg');
const path = require('path');

module.exports =  (files) => {
    imagemin([path.join(__dirname, `../storage/images/upload/${files.filename}`)], {
        destination: path.join(__dirname, '../storage/images/build'),
        plugins: [
            imageminMozjpeg({
                type: true,
                progressive: true,
                quality: 80
            }),
            imageminOptipng(),
        ]
    })
    .then(msg => {
        fs.unlink(path.join(__dirname, `../storage/images/upload/${files.filename}`), (err) => {
            if (err) {
                console.log(err);
                throw err;
            }
        });
    })
    .catch(err => {
        // if error occurs -> copy file to images/build
        fs.rename(path.join(__dirname, `../storage/images/upload/${files.filename}`), path.join(__dirname, '../storage/images/build'), (err) =>{
            if (err) {
                console.log(err);
                throw err;
            }
            fs.unlink(path.join(__dirname, `../storage/images/upload/${files.filename}`), (err) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            });
        });
        console.log(err);
    });
}