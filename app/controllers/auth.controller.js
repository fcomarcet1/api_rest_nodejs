'use strict';

require('dotenv').config();
const validator = require('validator');
const moment = require('moment');
const User = require('../models/user.model');
const jwt = require('../services/jwt');
const sendEmail = require('../services/mailer');
const utilsPassword = require('../helpers/utilsPassword');
const utilsEmail = require('../helpers/utilsEmail');

const {v4: uuidv4} = require('uuid');
const {customAlphabet: generate} = require('nanoid');

const CHARACTER_SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const REFERRAL_CODE_LENGTH = 8;
const referralCode = generate(CHARACTER_SET, REFERRAL_CODE_LENGTH);

//const bcrypt = require("bcrypt-node");
//const jwt = require("../services/jwt"); // service jwt for create token
//const nodemailer = require("../config/nodemailer.config");

// TODO: Modificar responses

/**
 * @description Register
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.signUp = async (req, res) => {
    // Check request.
    if (!req.body) {
        return res.status(403).send({
            status: 'error',
            message: 'ERROR. API can´t received the request.',
        });
    }

    // check if not send any required field
    if (
        req.body.name === undefined ||
        req.body.surname === undefined ||
        req.body.email === undefined ||
        req.body.password === undefined ||
        req.body.confirmPassword === undefined
    ) {
        return res.status(403).send({
            status: 'error',
            message: 'ERROR. Any field from register form not received.',
        });
    }

    try {
        let params = req.body;
        let name = params.name.trim();
        let surname = params.surname.trim();
        let email = params.email.trim();
        let password = params.password.trim();
        let confirmPassword = params.confirmPassword.trim();

        // Validate data from request (validator library)
        // Name
        let validateEmptyName = validator.isEmpty(name); // empty->true
        if (validateEmptyName) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo nombre puede estar vacio.',
            });
        }

        let validateValidName = validator.isAlpha(validator.blacklist(name, ' ')); // ok-> true
        if (!validateValidName) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo nombre no es valido no puede contener numeros.',
            });
        }

        // Surname
        let validateEmptySurname = validator.isEmpty(surname); // empty->true
        if (validateEmptySurname) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo apellidos puede estar vacio.',
            });
        }

        let validateValidSurname = validator.isAlpha(validator.blacklist(surname, ' ')); // ok-> true
        if (!validateValidSurname) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo apellidos no es valido no puede contener numeros.',
            });
        }

        // Email
        let validateEmptyEmail = validator.isEmpty(email);
        if (validateEmptyEmail) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo email esta vacio',
            });
        }

        let validateValidEmail = validator.isEmail(email);
        if (!validateValidEmail) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo email no es valido',
            });
        }

        // Password
        let validateEmptyPassword = validator.isEmpty(password);
        if (validateEmptyPassword) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo password no puede estar vacio.',
            });
        }

        let validateValidPassword = validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
        }); // ok -> true
        if (!validateValidPassword) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo password no es valido. Debe contener almenos: 8 caracteres, 1 minuscula, 1 mayuscula, 1 numero ',
            });
        }

        let validateEmptyPasswordConfirmation = validator.isEmpty(confirmPassword);
        if (validateEmptyPasswordConfirmation) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo confirmar password no puede estar vacio.',
            });
        }

        // check 2 password = confirmPassword
        let equalsPasswords = validator.equals(password, confirmPassword);
        //console.log(equalsPasswords);
        if (!equalsPasswords) {
            return res.status(400).send({
                status: 'error',
                error: 'Las contraseñas no coinciden.',
            });
        }

        //Check if the email has been already registered.
        const user = await User.findOne({email: email.toLowerCase()});

        if (user) {
            return res.json({
                status: 'error',
                error: true,
                message: 'Email is already in use',
            });
        }

        // Hash password
        const hash = await utilsPassword.hashPassword(password);

        //Generate unique id for the user.
        params.userId = uuidv4();
        //params.userId = uuid();

        //remove the confirmPassword field from the result as we dont need to save this in the db
        delete params.confirmPassword;
        params.password = hash;

        // Send email
        let code = Math.floor(100000 + Math.random() * 900000); //Generate random 6 digit code.

        const sendCode = await sendEmail(email.toLowerCase(), code);
        if (sendCode.error) {
            return res.status(500).json({
                status: 'error',
                error: true,
                message: "Couldn't send verification email.",
            });
        }

        params.emailToken = code;
        let expiry = Date.now() + 60 * 1000 * 120; //120 mins in ms
        params.emailTokenExpires = new Date(expiry);

        //Check if referred and validate code.
        /*if (params.hasOwnProperty("referrer")) {
            let referrer = await User.findOne({
                referralCode: params.referrer,
            });
            if (!referrer) {
                return res.status(400).send({
                    error: true,
                    message: "Invalid referral code.",
                });
            }
        }*/
        params.referralCode = referralCode();

        const newUser = new User(params);
        await newUser.save();

        return res.status(200).json({
            success: true,
            message: 'Registration Success. Check your email for confirmate your account',
            referralCode: params.referralCode,
        });
    } catch (error) {
        console.error('signup-error', error);
        return res.status(500).json({
            error: true,
            message: 'Cannot Register',
        });
    }
};

/**
 * Validate the user account with the confirmation code
 * @param req
 * @param res
 * @return {Promise<void>}
 */
exports.validateAccount = async (req, res) => {
    // Check request.
    if (!req.body) {
        return res.status(403).send({
            status: 'error',
            message: 'ERROR. API can´t received the request.',
        });
    }

    try {
        if (req.body.email === undefined || req.body.code === undefined) {
            return res.status(400).send({
                status: 'error',
                message: 'Please make a valid request any field not arrive',
            });
        }

        let params = req.body;
        let email = params.email.trim();
        let confirmationCode = params.code.trim();

        // Validation
        // Email
        let validateEmptyEmail = validator.isEmpty(email);
        if (validateEmptyEmail) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo email esta vacio',
            });
        }
        let validateValidEmail = validator.isEmail(email);
        if (!validateValidEmail) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo email no es valido',
            });
        }

        // Code
        let validateEmptyCode = validator.isEmpty(confirmationCode);
        if (validateEmptyCode) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo codigo de confirmacion esta vacio',
            });
        }

        let validateValidCode = validator.isNumeric(confirmationCode);
        if (!validateValidCode) {
            return res.status(400).send({
                status: 'error',
                error: 'El código de verificacion no puede contener letras, solo puede contener números revisa el codigo en tu correo',
            });
        }

        // Check if email exist in DB
        let checkEmail = await utilsEmail.existsEmail(email); // return true/false
        if (!checkEmail) {
            return res.status(400).send({
                status: 'error',
                message: ' El email introducido no pertenece a ningun usuario',
            });
        }

        /*const checkEmail = await User.findOne(
            {email: email.toLowerCase()},
            (err, email) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send({
                        status: "error",
                        message: " error while check if mail exist in db",
                        error: err,
                    });
                }
                if (!email) {
                    return res.status(400).send({
                        status: "error",
                        message: " El email introducido no pertenece a ningun usuario",
                    });
                }
            }
        );*/

        // check if confirmationCode is valid
        const user = await User.findOne({
            email: email,
            emailToken: confirmationCode,
            emailTokenExpires: {$gt: Date.now()},
        });

        if (!user || Object.keys(user).length === 0) {
            return res.status(400).json({
                status: 'error',
                error: true,
                message:
                    'Invalid code. Probably your authentication code is wrong or expired',
            });
        } else {
            if (user.active) {
                return res.status(400).send({
                    status: 'success',
                    message: 'Account already activated',
                });
            }

            user.emailToken = '';
            user.emailTokenExpires = null;
            user.active = true;

            // TODO: CHECK ERRORS SAVE()
            await user.save();

            return res.status(200).json({
                status: 'success',
                message: 'Account activated.',
            });
        }
    } catch (error) {
        console.error('activation-error', error);
        return res.status(500).json({
            status: 'error',
            error: true,
            message: error.message,
        });
    }
};

/**
 * @description Refresh expired confirmation code for active account.
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.refreshConfirmationCode = async (req, res) => {
    try {
        // Check request.
        if (!req.body) {
            return res.status(403).send({
                status: 'error',
                message: 'ERROR. API can´t received the request.',
            });
        }

        if (req.body.email === undefined) {
            return res.status(400).send({
                status: 'error',
                message: 'ERROR. API can´t received the field email.',
            });
        }

        let params = req.body;
        let email = params.email;

        // Validate
        // Email
        let validateEmptyEmail = validator.isEmpty(email);
        if (validateEmptyEmail) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo email esta vacio',
            });
        }
        let validateValidEmail = validator.isEmail(email);
        if (!validateValidEmail) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo email no es valido',
            });
        }

        // comprobar si existe req.body.email en bd
        const user = await User.findOne({email: email});

        if (!user) {
            return res.status(200).send({
                status: 'success',
                message:
                    'El email introducido no corresponde a ningun usuario registrado. Por favor introduce un email valido ',
            });
        }

        // Create confirmation code
        let code = Math.floor(100000 + Math.random() * 900000); //Generate random 6 digit code.
        let expiry = Date.now() + 60 * 1000 * 120; //120 mins in ms

        // send email
        const sendCode = await sendEmail(email.toLowerCase(), code);
        if (sendCode.error) {
            return res.status(500).json({
                status: 'error',
                error: true,
                message: "Couldn't send verification email.",
            });
        }

        // Update fields emailToken, emailTokenExpires in db
        params.emailToken = code;
        params.emailTokenExpires = new Date(expiry);

        const updateConfirmationCode = await User.findOneAndUpdate(
            {email: email},
            params
        );
        if (!updateConfirmationCode) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'Cannot refresh confirmationCode ',
            });
        }

        return res.status(200).send({
            status: 'success',
            error: false,
            message:
                'Por favor revisa tu correo e introduce la nueva clave de confirmacion',
        });
    } catch (error) {
        console.error('refresh confirmationCode-error', error);
        return res.status(500).send({
            status: 'error',
            message: 'Cannot refresh confirmationCode',
        });
    }
};

/**
 * @description Login
 * @param req
 * @param res
 * @return {Promise<void>}
 */
exports.signIn = async (req, res) => {
    try {
        // Check request.
        if (!req.body) {
            return res.status(403).send({
                status: 'error',
                message: 'ERROR. API can´t received the request.',
            });
        }

        // check if not send any required field
        if (req.body.email === undefined || req.body.password === undefined) {
            return res.status(403).send({
                status: 'error',
                message: 'ERROR. Any field from login form not received.',
            });
        }

        // Get params from request
        let params = req.body;

        let email = params.email.trim();
        let password = params.password.trim();

        // Validation
        // Email
        let validateEmptyEmail = validator.isEmpty(params.email);
        if (validateEmptyEmail) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo email esta vacio',
            });
        }
        let validateValidEmail = validator.isEmail(params.email);
        if (!validateValidEmail) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo email no es valido',
            });
        }

        // Password
        let validateEmptyPassword = validator.isEmpty(params.password);
        if (validateEmptyPassword) {
            return res.status(400).send({
                status: 'error',
                error: 'El campo password no puede estar vacio.',
            });
        }

        // Find if any account with that email exists in DB
        const user = await User.findOne({email: email});

        if (!user) {
            return res.status(404).send({
                status: 'error',
                error: true,
                message: 'Account not found',
            });
        }

        // Throw error if account is not activated (when in active the field active in db = true).
        if (!user.active) {
            return res.status(400).json({
                error: true,
                message: 'You must verify your email to activate your account',
            });
        }

        // TODO: *************** REVISAR **************************************
        // Verify the password is valid.
        console.log(utilsPassword.comparePassword('pepe', 'pepe'));
        const passwordIsValid = await utilsPassword.comparePassword(
            password,
            user.password
        );

        if (!passwordIsValid) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'Invalid credentials. Your password is wrong',
            });
        }

        // Generate Auth token createAuthToken return {error: false, token: token}
        const authToken = await jwt.createAuthToken(user);
        if (authToken.error) {
            return res.status(500).send({
                status: 'error',
                error: true,
                message: "Couldn't create access token. Please try again later",
            });
        }

        // Save token in db
        user.accessToken = authToken;
        const saveUser = await user.save();

        if (!saveUser || Object.keys(saveUser).length === 0) {
            return res.status(500).send({
                status: 'error',
                error: true,
                message: "Couldn't save access token for logging. Please try again later",
            });
        }

        // Return response with token
        return res.status(200).send({
            error: false,
            status: 'success',
            message: 'User logged in successfully',
            token: authToken,
        });
    } catch (error) {
        console.error('Login error', error);
        return res.status(500).send({
            error: true,
            status: 'error',
            message: 'Login error: ' + error,
        });
    }
};
