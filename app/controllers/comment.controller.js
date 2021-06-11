'use strict';

const Comment = require('../models/topic.model');
const Topic = require('../models/topic.model');
const mongoose = require('mongoose');

const jwtService = require('../services/jwt');
const validator = require('validator');
const {v4: uuidv4} = require('uuid');
const moment = require('moment');


/**
 * @description Create new comment
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.create = async (req, res) => {

    if (!req.params.topicId || !req.body) {
        return res.status(400).send({
            status: 'error',
            error: true,
            message: "API Cannot received parameters",
        });
    }

    try {
        // Get URL param && body params
        const topicId = req.params.topicId.toString();
        let params = req.body;
        let content = params.content.trim();

        // Find if id is valid
        let validTopicId = mongoose.Types.ObjectId.isValid(req.params.topicId);
        if (!validTopicId) {
            return res.status(404).send({
                status: 'error',
                error: true,
                message: 'This topic not exist: ',
            });
        }

        // Check if exist topic
        let topic = await Topic.findById({_id: topicId});
        if (!topic || Object.keys(topic).length === 0 || topic.length === 0) {
            return res.status(404).send({
                status: 'error',
                error: true,
                message: 'This topic not exist: ',
            });
        }

        // check if not send any required field
        if (req.body.content === undefined) {
            return res.status(403).send({
                status: 'error',
                error: true,
                message: 'ERROR.content field is required.',
            });
        }

        // Validate
        let validateEmptyContent = validator.isEmpty(content); // empty->true
        if (validateEmptyContent) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'El comentario no puede estar vacio.',
            });
        }

        let validateValidContent = validator.isAlphanumeric(
            validator.blacklist(content, ' */@{}<>.')
        );
        if (!validateValidContent) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'El comentario no es valido, no introduzcas caracteres especiales.',
            });
        }

        let identity = await jwtService.getIdentity(req.headers.authorization);

        // Create comment obj for save
        let comment = {
            content: content,
            user: identity._id,
        };

        // unset values
        /*comment.user.resetPasswordExpires = undefined;
        comment.user.emailToken = undefined;
        comment.user.emailTokenExpires = undefined;
        comment.user.emailTokenExpires = undefined;
        comment.user.accessToken = undefined;*/


        // En la propiedad comments del objeto resultante hacer un push
        await topic.comments.push(comment);

        // save topic with comment
        const commentSaved = await topic.save();
        if (!commentSaved || Object.keys(commentSaved).length === 0 || commentSaved.length === 0) {
            return res.status(404).send({
                status: 'error',
                error: true,
                message: 'Error al guardar el nuevo comentario: ',
            });
        } else {
            // find populate para devolver el topic
            let topic = await Topic.findById({_id: topicId})
                .populate('user')
                .populate('comments.user')
            ;

            let comments = topic.comments;

           /* await comments.forEach((listComments, index) =>{
                console.log(listComments.content);
            });*/

            //TODO: delete from topic personal information password...

            // Return response.
            return res.status(201).send({
                status: 'success',
                error: false,
                message: 'Comment created successful',
                //comments: comments,
                topic: topic,
            });
        }

    } catch (error) {
        console.error('create comment :', error);
        return res.status(500).send({
            status: 'error',
            error: true,
            message: 'Error when try create new comment: ' + error,
        });
    }


};


/**
 * @description Edit comment
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.update = async (req, res) => {

    if (!req.params.commentId || !req.body) {
        return res.status(400).send({
            status: 'error',
            error: true,
            message: "API Cannot received parameters",
        });
    }
    try {
        // Get params from url
        let commentId = req.params.commentId;
        let params = req.body;
        let content = params.content;

        // Check if exist topic
        // for this we need change the route and add topicId /comment/update/:topicId/:commentId

        // Check if exists comment && if user is the owner NO SE HACER QUERY
        //let comment = await Topic.findById({ comments: commentId });

        let validateEmptyContent = validator.isEmpty(content); // empty->true
        if (validateEmptyContent) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'El comentario no puede estar vacio.',
            });
        }

        let validateValidContent = validator.isAlphanumeric(
            validator.blacklist(content, ' */@{}<>.')
        );
        if (!validateValidContent) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'El comentario no es valido, no introduzcas caracteres especiales.',
            });
        }

        // Check if user is propietary of this comment
        let identity = await jwtService.getIdentity(req.headers.authorization);

        let comment = await Topic.findOne(
            {
                "comments._id": commentId,
                "comments.user": identity._id
            });

        if (!comment || Object.keys(comment).length === 0 || comment.length === 0){
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'No puedes modificar un comentario que no eres propietario.',
            });
        }

        // find and update subdocument
        let commentUpdated = await Topic.findOneAndUpdate(
            { "comments._id": commentId },
            {
                "$set": {
                    "comments.$.content": content //con $ indicamos el commentId
                }
            },
            {new:true}
        );

        // Return response.
        return res.status(200).send({
            status: 'success',
            error: false,
            message: 'Comment updated successful',
            comment: comment,
            commentUpdated: commentUpdated,
        });

    }catch (error){
        console.error('update comment :', error);
        return res.status(500).send({
            status: 'error',
            error: true,
            message: 'Error when try update comment: ' + error,
        });
    }



};


/**
 * @description Delete comment
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.delete = async (req, res) => {

    if (!req.params.commentId || !req.params.topicId ) {

        return res.status(400).send({
            status: 'error',
            error: true,
            message: "API Cannot received parameters",
        });
    }

    try {
        // Sacar el id del topic y del comentario a borrar
        let commentId = req.params.commentId;
        let topicId = req.params.topicId;

        // Buscar el topic
        let issetTopic = await Topic.findById({_id: topicId});
        if (!issetTopic || Object.keys(issetTopic).length === 0 || issetTopic.length === 0){
            return res.status(404).send({
                status: 'error',
                error: true,
                message: 'This topic not exists',
            });
        }

        // Comprobar que el usuario es el propietario.
        let identity = await jwtService.getIdentity(req.headers.authorization);

        let topic = await Topic.findOne(
            {
                "comments._id": commentId,
                "comments.user": identity._id
            });

        if (!topic || Object.keys(topic).length === 0 || topic.length === 0){
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'No puedes eliminar un comentario del cual no eres propietario.',
            });
        }
        // Seleccionar el subdocumento (comentario)
        let comment = topic.comments.id(commentId);

        if (!comment || Object.keys(comment).length === 0 || comment.length === 0){
            return res.status(404).send({
                status: 'error',
                error: true,
                message: 'El comentario no existe.',
            });
        }

        // Borrar el comentario
        let commentDeleted = await comment.remove();


        // Actualizar topic
        let topicSaved = await topic.save();


        // Return response.
        return res.status(200).send({
            status: 'success',
            error: false,
            message: 'Comment deleted successful',
            //comment: comment,

        });

    }catch (error){
        console.error('delete comment :', error);
        return res.status(500).send({
            status: 'error',
            error: true,
            message: 'Error when try delete comment: ' + error,
        });
    }


};
