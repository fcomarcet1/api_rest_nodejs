"use strict";

const express = require("express");
const router = express.Router();

const UserController = require("../controllers/user.controller");
const cleanBody = require("../middlewares/cleanBody");
const AuthMiddleware = require("../middlewares/verifyAuth");
const RoleMiddleware = require("../middlewares/verifyRole");

//*********************************** ROUTES ***********************************
router.get("/profile", [cleanBody, AuthMiddleware.verifyAuth], UserController.show);
router.get(
    "/all",
    [
        cleanBody,
        AuthMiddleware.verifyAuth,
        RoleMiddleware.checkRoleAdmin
    ],
    UserController.getAll
);
router.get("/edit",[cleanBody, AuthMiddleware.verifyAuth,], UserController.edit);
router.put("/edit", [cleanBody, AuthMiddleware.verifyAuth,], UserController.update);
router.delete("/delete",[cleanBody, AuthMiddleware.verifyAuth], UserController.delete);



module.exports = router;