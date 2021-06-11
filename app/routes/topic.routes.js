'use strict';

const express = require('express');
const router = express.Router();

const TopicController = require('../controllers/topic.controller');
const cleanBody = require('../middlewares/cleanBody');
const AuthMiddleware = require('../middlewares/verifyAuth');
const RoleMiddleware = require("../middlewares/verifyRole");

//******************************* ROUTES *******************************
// Create new topic
router.post('/topic/create',
    [cleanBody, AuthMiddleware.verifyAuth],
    TopicController.create
);

//List of all topics no paginate (ROLE_ADMIN)
router.get('/topics/list',
    [cleanBody, AuthMiddleware.verifyAuth, RoleMiddleware.checkRoleAdmin],
    TopicController.getTopics
);

// List of all topics paginate
router.get('/topics/all/:page?',
    [cleanBody, AuthMiddleware.verifyAuth],
    TopicController.getTopicsPaginate
);

// List topics by user
router.get('/topics/user/:userId',
    [cleanBody, AuthMiddleware.verifyAuth],
    TopicController.getTopicsByUser
);

// Topic detail
router.get('/topic/detail/:topicId',
    [cleanBody, AuthMiddleware.verifyAuth],
    TopicController.getTopicDetail
);

// Topic update.
router.put('/topic/update/:topicId',
    [cleanBody, AuthMiddleware.verifyAuth],
    TopicController.update
);

// Topic delete
router.delete('/topic/delete/:topicId',
    [cleanBody, AuthMiddleware.verifyAuth],
    TopicController.delete
);

module.exports = router;
