"use strict";

const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/auth.controller");
const cleanBody = require("../middlewares/cleanBody");


// ************************** API USER ROUTES *****************************************
router.post("/register",cleanBody, AuthController.signUp);
router.patch("/activate", cleanBody, AuthController.validateAccount);
router.patch("/refresh-confirmationCode", AuthController.refreshConfirmationCode );
router.post("/login", AuthController.signIn);


module.exports = router;