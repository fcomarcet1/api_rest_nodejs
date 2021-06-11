'use strict';
const User = require("../models/user.model");
const jwt = require("../services/jwt");
const validator = require("validator");
const moment = require("moment");

/**
 * @description Get user info
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.show = async (req, res) => {

    try {
        // get token from headers
        const token = req.headers.authorization;

        // Get data from user
        const identity = await jwt.getIdentity(token);
        if (identity.error) {
            return res.status(404).send({
                status: "error",
                error: true,
                message: "Error cant get user info : " + error,
            });
        }

        // Unset fields from user
        identity.role = undefined;
        identity.active = undefined;
        identity.resetPasswordToken = undefined;
        identity.resetPasswordExpires = undefined;
        identity.emailTokenExpires = undefined;
        identity.emailToken = undefined;
        identity.referrer = undefined;
        identity.password = undefined;
        identity.accessToken = undefined;
        identity.referralCode = undefined;
        identity.__v = undefined;
        identity._id = undefined;

        // Return response
        return res.status(200).send({
            status: "success",
            error: false,
            message: "Info user logged NOTE: _id: id document, userId: userId",
            user: identity,
        });

    } catch (error) {
        console.error("show logged user:", error);
        return res.status(500).send({
            status: "error",
            error: true,
            message: "Error when try show logged user: " + error,
        });
    }


};

/**
 * @description Get user list only ROLE_ADMIN.
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.getAll = async (req, res) => {

    try {
        const users = await User.find();
        if (!users) {
            return res.status(404).send({
                status: "error",
                error: true,
                message: "No existen usuarios registrados actualmente.",
            });
        }

        // Unset fields from user
        users.forEach((value) => {
            value["password"] = undefined;
            value["__v"] = undefined;
            value["emailToken"] = undefined;
            value["emailTokenExpires"] = undefined;

        });

        // Return response
        return res.status(200).send({
            status: "success",
            error: false,
            users: users,
        });
    } catch (error) {
        console.error("show all users:", error);
        return res.status(500).send({
            status: "error",
            error: true,
            message: "Error when try show all users list: " + error,
        });
    }
};

/**
 * @description Get user data for fill update user account.
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.edit = async (req, res) => {

    try {

        // get token from headers
        const authToken = req.headers.authorization;

        // Get data from user
        const identity = await jwt.getIdentity(authToken);

        // Unset fields from user
        identity.role = undefined;
        identity.active = undefined;
        identity.resetPasswordToken = undefined;
        identity.resetPasswordExpires = undefined;
        identity.emailTokenExpires = undefined;
        identity.emailToken = undefined;
        identity.referrer = undefined;
        identity.password = undefined;
        identity.accessToken = undefined;
        identity.referralCode = undefined;
        identity.__v = undefined;
        identity._id = undefined;

        // Return response
        return res.status(200).send({
            status: "success",
            error: false,
            message: "Edit user",
            user: identity,
        });

    } catch (error) {
        console.error("edit user:", error);
        return res.status(500).send({
            status: "error",
            error: true,
            message: "Error when try show data user for edit: " + error,
        });
    }
};

/**
 * @description Update and save new user data
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.update = async (req, res) => {

    // Check request.
    if (!req.body) {
        return res.status(403).send({
            status: "error",
            error: true,
            message: "ERROR. API can´t received the request.",
        });
    }
    // check if not send any required field
    if (
        req.body.name === undefined ||
        req.body.surname === undefined ||
        req.body.email === undefined
    ) {
        return res.status(403).send({
            error: true,
            status: "error",
            message: "ERROR. Any field from user update form not received.",
        });
    }

    try {

        // Get data from request
        let params = req.body;

        // trim data from request
        params.name = params.name.trim();
        params.surname = params.surname.trim();
        params.email = params.email.trim();

        // Validate data from request (validator library)
        // Name
        let validateEmptyName = validator.isEmpty(params.name); // empty->true
        let validateValidName = validator.isAlpha(validator.blacklist(params.name, " ")); // ok-> true

        if (validateEmptyName) {
            return res.status(400).send({
                status: "error",
                error: "El campo nombre puede estar vacio.",
            });
        }
        if (!validateValidName) {
            return res.status(400).send({
                status: "error",
                error: "El campo nombre no es valido no puede contener numeros.",
            });
        }

        // Surname
        let validateEmptySurname = validator.isEmpty(params.surname); // empty->true
        let validateValidSurname = validator.isAlpha(validator.blacklist(params.surname, " ")); // ok-> true

        if (validateEmptySurname) {
            return res.status(400).send({
                status: "error",
                error: "El campo apellidos puede estar vacio.",
            });
        }

        if (!validateValidSurname) {
            return res.status(400).send({
                status: "error",
                error: "El campo apellidos no es valido no puede contener numeros.",
            });
        }

        // Email
        let validateEmptyEmail = validator.isEmpty(params.email);
        let validateValidEmail = validator.isEmail(params.email);

        if (validateEmptyEmail) {
            return res.status(400).send({
                status: "error",
                error: "El campo email esta vacio",
            });
        }

        if (!validateValidEmail) {
            return res.status(400).send({
                status: "error",
                error: "El campo email no es valido",
            });
        }
        // get user id
        let token = req.headers.authorization;
        let identity = await jwt.getIdentity(token);

        if (identity.error) {
            return res.status(404).send({
                status: "error",
                error: true,
                message: "Error when try update user info : " + error,
            });
        }

        // Check if input email has been modified and check if exists in db and your owner
        if (params.email !== identity.email) {

            let user = await User.findOne({email: params.email.toLowerCase()});

            if (user && user.email === params.email) {
                return res.status(200).send({
                    status: "success",
                    message: "Email no valido ya pertenece a otro usuario"
                });
            }
            else {
                // Find && update document
                params.updatedAt = moment().format();

                let userUpdated = await User.findOneAndUpdate(
                    {
                        _id: identity._id,
                        userId: identity.userId
                    },
                    params,
                    {new: true}
                );

                if (userUpdated == null){
                    return res.status(400).send({
                        status: "error",
                        error: true,
                        message: "server cant update user: ",
                    });
                }

                // Unset object keys
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
                    message: "User info updated successful",
                    user: userUpdated,
                });
            }

        } else { // case user not modify field email
            // find document && update
            params.updatedAt = moment().format();

            let userUpdated = await User.findOneAndUpdate(
                {
                    _id: identity._id,
                    userId: identity.userId
                },
                params,
                {new: true}
            );

            // Unset object keys
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
                message: "User info updated successful",
                user: userUpdated,
            });
        }

    } catch (error) {
        console.error("edit user:", error);
        return res.status(500).send({
            status: "error",
            error: true,
            message: "Error when try update data user : " + error,
        });
    }
};

/**
 * @description Delete user account.
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.delete = async (req, res) => {
    //  IMPORTANT: in frontend -> delete token from local storage

    // Check if it arrives request.
    if (!req.body) {
        return res.status(403).send({
            status: "error",
            message: "ERROR. Can´t received request.",
        });
    }

    try{
        // get logged users && userId for delete
        let token = req.headers.authorization;
        let identity = await jwt.getIdentity(token);
        if (identity.error) {
            return res.status(404).send({
                status: "error",
                error: true,
                message: "Error when try get identity user info : " + error,
            });
        }

        // TODO: Delete all comments && Delete all topics of this user
        // Delete all comments
        // Delete all topics of this user

        // delete user
        const userDeleted = await User.findOneAndDelete({_id: identity._id, userId: identity.userId});

        return res.status(200).send({
            status: "success",
            error: false,
            message: "User account deleted successful",
            //user: userDeleted,
        });


    }catch (error) {
        console.error("delete user:", error);
        return res.status(500).send({
            status: "error",
            error: true,
            message: "Error when try delete user account : " + error,
        });
    }


};