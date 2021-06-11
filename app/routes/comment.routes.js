'use strict';

const express = require('express');
const router = express.Router();

const CommentController = require('../controllers/comment.controller');
const cleanBody = require('../middlewares/cleanBody');

const AuthMiddleware = require('../middlewares/verifyAuth');
const RoleMiddleware = require("../middlewares/verifyRole");


//******************************* ROUTES *******************************
// Create new comment.
router.post(
    '/comment/create/topic/:topicId',
    [cleanBody, AuthMiddleware.verifyAuth],
    CommentController.create
);

// Update comment
router.put(
    '/comment/update/:commentId',
    [cleanBody, AuthMiddleware.verifyAuth],
    CommentController.update
);

// Delete comment
router.delete(
    '/comment/delete/:topicId/:commentId',
    [cleanBody, AuthMiddleware.verifyAuth],
    CommentController.delete
);



module.exports = router;
