'use strict';

const bcrypt = require("bcryptjs");

/**
 * @description Encrypt password
 * @param req
 * @param res
 * @param password
 * @return {Promise<*>}
 */
exports.hashPassword = async (password) => {

    try{
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }
    catch (error) {
        console.log(error);
        // ?throw error or response error????¿
        throw new Error("Hashing failed" + error);
    }
};

/**
 * @description Compare input password with hashed password.
 * @param inputPassword
 * @param hashedPassword
 * @return {Promise<*>}
 */
exports.comparePassword = async (inputPassword, hashedPassword) => {

    try {
        return await bcrypt.compare(inputPassword, hashedPassword);
    }
    catch (error) {
        console.error("Comparison failed", error);
        return {
            status: "error",
            error: true,
            message: "Comparison failed: " + error,
        };
        //throw new Error("Comparison failed" + error);
    }

};