'use strict';

const bcrypt = require("bcryptjs");
const User = require("../models/user.model")

/**
 *
 * @param email
 *
 */
exports.existsEmail = async (email) => {

    try {
        //let existsEmail = false;
        const user = await User.findOne({email: email.toLowerCase()});
        if (user) {
            return user;
        } else {
            return false;
        }

    } catch (error) {
        console.log(error);
        // ?throw error or response error????¿
        throw new Error("check exists email failed " + error);
    }
};