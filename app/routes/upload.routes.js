"use strict";
const express = require("express");


const cleanBody = require("../middlewares/cleanBody"),
    UserController = require("../controllers/user.controller"),
    UploadController = require("../controllers/upload.controller"),
    AuthMiddleware = require("../middlewares/verifyAuth"),
    moment = require("moment"),
    RoleMiddleware = require("../middlewares/verifyRole"),
    multer = require("multer");
    //UploadMiddleware = require("../middlewares/upload");

const router = express.Router();

// Parameters upload files
// set config to storage files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads/tmp");
    },
    filename: function (req, file, cb) {
        let uniqueName = moment().unix() + "_" + file.originalname;
        cb(null, file.originalname);
    },
});
const upload = multer({ storage: storage });


//*********************************** ROUTES ***********************************
router.put("/avatar",[
        cleanBody,
        AuthMiddleware.verifyAuth,
        upload.single("file0")
    ],
    UploadController.uploadAvatar
);

module.exports = router;