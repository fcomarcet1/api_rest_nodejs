'use strict';

const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user.model");
const jwtService = require("../services/jwt");
const moment = require("moment");

/**
 * @description Chek if user is authenticated
 * @param req
 * @param res
 * @param next
 * @return {Promise<*>}
 */
exports.verifyAuth = async (req, res, next) => {

    // Check if it arrives header authorization.
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "error",
            error: true,
            message: "Unauthorized. Cant received token from http headers forbidden access",
        });
    }
    try {

        // Get and Clear token -> remove quotes or double quotes
        let token = await req.headers.authorization.replace(/['"]+/g, "");

        // TODO: REVISAR
        // Check token with secret.
        let verifiedToken = await jwt.verify(token, process.env.JWT_SECRET);

        // Check token with db.
        let checkTokenDB = await User.findOne({
            accessToken: token,
            userId: verifiedToken.userId,
        });

        if (!checkTokenDB || Object.keys(checkTokenDB).length === 0) {
            return res.status(404).send({
                status: "error",
                error: true,
                message: "Unauthorized. Token not valid.",
            });
        }

        // Check token has expired
        if(verifiedToken.exp <= moment().unix()){
            return res.status(404).send({
                status: "error",
                error: true,
                message: 'Unauthorized. Token expired'
            });
        }

        /*let checkToken = await jwtService.verifyToken(token);
        if (checkToken.error) {
            return res.status(403).send({
                status: "error",
                error: true,
                message: "Unauthorized. Cant verify token forbidden access",
            });
        }*/

        // find user in DB
        let identity = await jwtService.getIdentity(token);
        if (identity.error){
            return res.status(403).send({
                status: "error",
                error: true,
                message: "Unauthorized. Cant verify token forbidden access",
            });
        }

        const user = await User.findOne({userId: identity.userId});
        if (!user) {
            return res.status(403).send({
                status: "error",
                error: true,
                message: "Unauthorized. Invalid token.",
            });
        }

        next();

    } catch (error) {

        console.error("verify if user is authenticated", error);
        return res.status(500).send({
            status: "error",
            error: true,
            message: "Error middleware verifyAuth" + error,
        });
    }

};
