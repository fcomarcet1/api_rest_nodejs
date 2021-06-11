'use strict';
/**
 * @description Middleware for update files
 * @param req
 * @param res
 * @param next
 * @return {Promise<void>}
 */
exports.uploadMiddleware = async (req, res, next) => {

    const multer = require('multer');
    const moment = require('moment');

    //set config to storage files
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "./uploads/tmp");
        },
        filename: function (req, file, cb) {
            let uniqueName = moment().unix() + "_" + file.originalname;
            cb(null, file.originalname);
        },
    });

    const upload = multer({
        limits: {
            fileSize: 4 * 1024 * 1024,
        },
        storage: storage,
    });


};