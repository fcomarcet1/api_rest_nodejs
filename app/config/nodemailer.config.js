'use strict';

const nodemailer = require("nodemailer");
const config = require("../config/auth.config");
const configServer = require("./server.config");

const user = config.user;
const pass = config.pass;

const transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    secure: false,
    auth: {
        user: "9be90c2c0fa7b3",
        pass: "2ddccfe3577484"
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports.sendConfirmationEmail = (name, email, confirmationCode) => {
    transport.sendMail({
        from: user,
        to: email,
        subject: "Please confirm your account",
        html: `<h1>Email Confirmation</h1>
        <h2>Hello ${name}</h2>
        <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
        <a href=http://localhost:3099/api/auth/confirm/${confirmationCode}> Click here</a>
        </div>`,
    }).catch(err => console.log(err));
};

/*
const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        users: users,
        pass: pass,
    },
});*/

/*var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        users: users,
        pass: pass
    }
});*/
