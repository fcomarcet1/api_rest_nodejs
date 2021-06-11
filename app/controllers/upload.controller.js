'use strict';

const User = require("../models/user.model"); // Models
const fs = require("fs");
const path = require("path");
const fse = require('fs-extra')
const mv = require('mv');
const configUpload = require("../config/upload.config");
const moment = require("moment");
const jwt = require("../services/jwt");

/**
 *
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.uploadAvatar = async (req, res) => {

    // Check if request arrive
    if (!req.body) {
        return res.status(403).send({
            status: "error",
            message: "ERROR. Can´t received request.",
        });
    }

    if (req.file === undefined) {
        return res.status(400).send({
            status: "error",
            message: "Avatar field is empty. please select a image",
        });
    }

    try{
        let filename = req.file.filename;
        let filePath = req.file.path;

        //  tmp is a initial folder where save before validate
        let tmpPath = configUpload.tmpPath + '/' + filename

        /*user is a final folder where save avatars after validations
        final name to save in db -> 03524566546_image.png*/
        let destName = moment().unix() + "_" + filename;

        // configUpload.dstPath -> './uploads/users/'
        let destPath = configUpload.dstPath + '/' + destName;

        // copy file to users folder && remove from tmp folder
        await fse.copy(tmpPath, destPath);

        // remove file from tmp folder
        await fs.promises.unlink(tmpPath);

        // save name path in db
        const identity = await jwt.getIdentity(req.headers.authorization);
        if (identity.error) {
            return res.status(404).send({
                status: "error",
                error: true,
                message: "Error cant upload avatar : " + error,
            });
        }

        let userUpdated = await User.findOneAndUpdate(
            {
                _id: identity._id,
                userId: identity.userId
            },
            {
                image: destName,
                updatedAt: moment().unix(),
            },
            {new: true}
        );

        if (userUpdated == null){
            return res.status(400).send({
                status: "error",
                error: true,
                message: "server cant update avatar: ",
            });
        }

        // TODO: ELIMINAR ANTIGUA FOTO DEL CARPETA USERS

        /// Unset object keys
        userUpdated.role = undefined;
        userUpdated.active = undefined;
        userUpdated.resetPasswordToken = undefined;
        userUpdated.resetPasswordExpires = undefined;
        userUpdated.emailTokenExpires = undefined;
        userUpdated.emailToken = undefined;
        userUpdated.referrer = undefined;
        userUpdated.password = undefined;
        userUpdated.accessToken = undefined;
        userUpdated.referralCode = undefined;
        userUpdated.__v = undefined;
        userUpdated._id = undefined;

        return res.status(200).send({
            status: "success",
            error: false,
            message: "Upload avatar successful",
            userUpdated: userUpdated,
        });

    }catch (error) {
        console.error("upload avatar:", error);
        return res.status(500).send({
            status: "error",
            error: true,
            message: "Error when try upload avatar: " + error,
        });
    }


    // not necessary because always send input
    /*if (Object.keys(req.body).length === 0 && req.file === undefined) {
        return res.status(400).send({
            status: "error",
            message: "Cant received avatar Please add input name='file0' for send avatar",
        });
    }*/

};


/**
 *
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.getAvatar = async (req, res) => {};
