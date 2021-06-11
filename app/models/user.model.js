"use strict";

const mongoose = require("mongoose");

const uniqueValidator = require("mongoose-unique-validator");
const configRoles = require("../config/roles.config")
const Schema = mongoose.Schema;


const userSchema = new Schema(
    {
        userId: {
            type: String,
            unique: true,
            required: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        surname: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: String,
            default: configRoles.user,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        image: {
            type: String,
            trim: true,
            default: null,
        },
        active: {
            type: Boolean,
            default: false,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
        },
        resetPasswordToken: {
            type: String,
            default: null,
            trim: true,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
            trim: true,
        },
        emailToken: {
            type: String,
            default: null,
            trim: true,
        },
        emailTokenExpires: {
            type: Date,
            default: null
        },
        accessToken: {
            type: String,
            default: null,
            trim: true,
        },
        referralCode: {
            type: String,
            unique: true,
            trim: true,
        },
        referrer: {
            type: String,
            default: null,
            trim: true,
        },
    },
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    }
);

// Do not show fields with private information
userSchema.methods.toJSON = function () {
    let obj = this.toObject();

    delete obj.password;
    delete obj.__v ;
    /*delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;*/

    return obj;
}

/*const UserSchema = new Schema(
    {
        name: {
            type: String,
            //lowercase: true,
            trim: true,
            required: [true, "can't be blank"],
            match: [/^[a-zA-Z ]+$/, "is invalid"],
        },
        surname: {
            type: String,
            //lowercase: true,
            trim: true,
            required: [true, "can't be blank"],
            match: [/^[a-zA-Z ]+$/, "is invalid"],
        },
        email: {
            type: String,
            //lowercase: true,
            trim: true,
            required: [true, "can't be blank"],
            match: [/\S+@\S+\.\S+/, "is invalid"],
            index: true,
        },
        password: {type: String},
        role: String,
        confirmationCode: {
            type: String,
            index: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Active"],
            default: "Pending",
        },
        image: String, // String is shorthand for {type: String}
        //actived: { type: String, default: false },
    },
    { timestamps: true }
);*/
userSchema.plugin(uniqueValidator, { message: "is already taken." });


// ****************** EXPORTS MODEL *******************
module.exports = mongoose.model("User", userSchema);
