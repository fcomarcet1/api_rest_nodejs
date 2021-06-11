'use strict';

const Topic = require('../models/topic.model');
const jwtService = require('../services/jwt');
const validator = require('validator');
const {v4: uuidv4} = require('uuid');
const moment = require('moment');
const mongoose = require('mongoose');


/**
 * @description Create new topic
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.create = async (req, res) => {
    // Check request
    if (!req.body) {
        return res.status(403).send({
            status: 'error',
            error: true,
            message: 'ERROR. API can´t received the request.',
        });
    }

    // check if not send any required field
    if (
        req.body.title === undefined ||
        req.body.content === undefined ||
        req.body.code === undefined ||
        req.body.language === undefined
    ) {
        return res.status(403).send({
            status: 'error',
            message: 'ERROR. Any field from create topic form not received.',
        });
    }

    try {
        let params = req.body;

        // Trim data
        params.title.trim();
        params.content.trim();
        params.code.trim();
        params.language.trim();

        // validate fields
        // Title
        let validateEmptyTitle = validator.isEmpty(params.title); // empty->true
        if (validateEmptyTitle) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'El campo titulo puede estar vacio.',
            });
        }

        let validateValidTitle = validator.isAlphanumeric(
            validator.blacklist(params.title, ' */@{}<>.')
        ); // ok-> true
        if (!validateValidTitle) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message:
                    'El campo titulo no es valido no no introduzcas caracteres especiales.',
            });
        }

        // Content
        let validateEmptyContent = validator.isEmpty(params.content); // empty->true
        if (validateEmptyContent) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'El campo contenido puede estar vacio.',
            });
        }

        // Language
        let validateEmptyLanguage = validator.isEmpty(params.language); // empty->true
        if (validateEmptyLanguage) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'El campo contenido puede estar vacio.',
            });
        }

        // Code Optional
        /*let validateValidCode = validator.isAlpha(validator.blacklist(params.code, " ")); // ok-> true
        if (!validateValidCode) {
            return res.status(400).send({
                status: "error",
                error: "El campo contenido no es valido no puede contener numeros.",
            });
        }*/

        // Crear objeto a guardar
        let topic = new Topic();

        // Get user id
        let token = req.headers.authorization;

        let identity = await jwtService.getIdentity(token);
        if (identity.error || Object.keys(identity).length === 0) {
            return res.status(404).send({
                status: 'error',
                error: true,
                message: 'Error cant create new topic',
            });
        }

        // Asignar valores
        topic.topicId = uuidv4();
        topic.title = params.title;
        topic.content = params.content;
        topic.code = params.code;
        topic.lang = params.language;
        topic.user = identity._id;

        // Guardar el topic
        let topicSaved = await topic.save();

        if (!topicSaved || Object.keys(topicSaved).length === 0) {
            return res.status(404).send({
                status: 'error',
                error: true,
                message: 'Error cant create new topic',
            });
        }

        // Return response.
        return res.status(201).send({
            status: 'success',
            error: false,
            message: 'Topic created successful',
            topicSaved: topicSaved,
        });
    } catch (error) {
        console.error('create topic:', error);
        return res.status(500).send({
            status: 'error',
            error: true,
            message: 'Error when try create new topic: ' + error,
        });
    }
};

/**
 * @description Get a list of topics.
 * @param  req
 * @param  res
 * @return {Promise<*>}
 */
exports.getTopics = async (req, res) => {

    try {
        const topics = await Topic.find();
        if (!topics || Object.keys(topics).length === 0) {
            return res.status(404).send({
                status: 'error',
                error: true,
                message: 'No existen topics actualmente.',
            });
        }

        // Unset fields from topics
        topics.forEach((value) => {
            value['__v'] = undefined;
        });

        // Return response
        return res.status(200).send({
            status: 'success',
            error: false,
            topics: topics,
        });
    } catch (error) {
        console.error('show all topics:', error);
        return res.status(500).send({
            status: 'error',
            error: true,
            message: 'Error when try show all topics list: ' + error,
        });
    }
};

/**
 * @description Get a list of topics paginate.
 * @param  req
 * @param  res
 * @return {Promise<*>}
 */
exports.getTopicsPaginate = async (req, res) => {

    try {
        //Cargar libreria paginacion (topic model) -> require + load plugin

        // If we do not indicate the page by parameter(GET) -> get default page = 1
        var page;
        if (!req.params.page || req.params.page === 0 || req.params.page === "0" ||
            req.params.page === null || req.params.page === undefined || isNaN(req.params.page)
        ) {
            page = 1;
        } else {
            page = await parseInt(req.params.page);
        }

        // Paginate options
        var options = {
            sort: {date: -1}, //
            populate: 'user', // Paths which should be populated with other documents
            limit: 5, // nº de elementos por pagina
            page: page // nº de pagina
        };

        //find paginado
        const topics = await Topic.paginate({}, options);

        // return (topics, total de topics, total de paginas)
        return res.status(200).send({
            status: 'success',
            error: false,
            message: "Topic paginated list",
            page: page,
            topics: topics.docs,
            totalDocs: topics.totalDocs,
            totalPages: topics.totalPages
        });


    } catch (error) {
        console.error('show all topics paginate:', error);
        return res.status(500).send({
            status: 'error',
            error: true,
            message: 'Error when try show all topics paginate list: ' + error,
        });
    }


};

/**
 * @description Get topics by user
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.getTopicsByUser = async (req, res) => {

    try {

        let userId = await req.params.userId;

        const topicsByUser = await Topic.find({user: userId}).sort([['createdAt', 'descending']]);

        if (topicsByUser === null || Object.keys(topicsByUser) === 0 || topicsByUser.length === 0) {
            return res.status(200).send({
                status: 'success',
                error: false,
                message: "No existen topics de ese usuario",

            });
        }

        return res.status(200).send({
            status: 'success',
            error: false,
            message: "Topics by user",
            params: userId,
            topics: topicsByUser,
            length: topicsByUser.length,
        });


    } catch (error) {
        console.error('show all topics by user:', error);
        return res.status(500).send({
            status: 'error',
            error: true,
            message: 'Error when try show all topics by user: ' + error,
        });
    }
};

/**
 * @description Get topic detail.
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.getTopicDetail = async (req, res) => {
    try {
        // Check GET parameter topic id(_id document).
        if (!req.params.topicId) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: "Cannot received GET userId parameter",
            });
        }

        // Get topic Id
        let topicId = req.params.topicId;

        // Find topic in DB
        let topic = await Topic.findOne({topicId: topicId})
            .sort([['createdAt', 'descending']])
            .populate('user')
        ;

        if (!topic || Object.keys(topic).length === 0 || topic.length === 0) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: "Not exists topic",
            });
        }

        // Return response
        return res.status(200).send({
            status: 'success',
            error: false,
            message: "Topic detail",
            topicId: topicId,
            topic: topic,
        });


    } catch (error) {
        console.error('show topic detail:', error);
        return res.status(500).send({
            status: 'error',
            error: true,
            message: 'Error when try show topic detail: ' + error,
        });
    }
};

/**
 * @description Update topic.
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.update = async (req, res) => {

    // Check request
    if (!req.body) {
        return res.status(403).send({
            status: 'error',
            error: true,
            message: 'ERROR. API can´t received the request.',
        });
    }
    // check if not send any required field
    if (
        req.body.title === undefined ||
        req.body.content === undefined ||
        req.body.code === undefined ||
        req.body.language === undefined
    ) {
        return res.status(403).send({
            status: 'error',
            message: 'ERROR. Any field from create topic form not received.',
        });
    }

    try {

        let validTopicId = mongoose.Types.ObjectId.isValid(req.params.topicId);

        if (!validTopicId){
            return res.status(404).send({
                status: 'error',
                error: true,
                message: 'This topic not exist: ' + error,
            });
        }

        // Recoger el id del topic de la url
        let topicId = await req.params.topicId.toString();

        // Recoger los datos que llegan desde post
        let params = req.body;

        let validateEmptyTitle = validator.isEmpty(params.title); // empty->true
        if (validateEmptyTitle) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'El campo titulo puede estar vacio.',
            });
        }

        let validateValidTitle = validator.isAlphanumeric(
            validator.blacklist(params.title, ' */@{}<>.')
        ); // ok-> true
        if (!validateValidTitle) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message:
                    'El campo titulo no es valido no no introduzcas caracteres especiales.',
            });
        }

        // Content
        let validateEmptyContent = validator.isEmpty(params.content); // empty->true
        if (validateEmptyContent) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'El campo contenido puede estar vacio.',
            });
        }

        // Language
        let validateEmptyLanguage = validator.isEmpty(params.language); // empty->true
        if (validateEmptyLanguage) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'El campo contenido puede estar vacio.',
            });
        }

        // Find and update del topic por id y por id de usuario
        let token = req.headers.authorization;
        let identity = await jwtService.getIdentity(token);

        params.updatedAt = moment().format();

        let topicUpdated = await Topic.findOneAndUpdate(
            {_id: topicId, user: identity._id},
            params,
            {new: true}
        );

        if (
            !topicUpdated ||
            Object.keys(topicUpdated).length === 0 ||
            topicUpdated.length === 0
        ) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'Error al actualizar el topic.',
            });
        }

        // Return response
        return res.status(200).send({
            status: 'success',
            error: false,
            message: "Topic update",
            topicUpdated: topicUpdated,
        });

    } catch (error) {
        console.error('update topic error:', error);
        return res.status(500).send({
            status: 'error',
            error: true,
            message: 'Error when try update topic: ' + error,
        });
    }
};


/**
 * @description Delete topic.
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.delete = async (req, res) => {

    if (!req.params.topicId) {
        return res.status(400).send({
            status: 'error',
            error: true,
            message: "Error not arrives Topic id",
        });
    }

    try {
        // Get URl param (GET)
        let topicId = req.params.topicId.toString();
        let identity = await jwtService.getIdentity(req.headers.authorization);

        // Find and delete for topicID and userID
        let topicDeleted = await Topic.findOneAndDelete({topicId: topicId, user: identity._id});

        if (
            !topicDeleted ||
            Object.keys(topicDeleted).length === 0 ||
            topicDeleted.length === 0
        ) {
            return res.status(400).send({
                status: 'error',
                error: true,
                message: 'El topic que deseas eliminar no existe.',
            });
        }

        // Return response
        return res.status(200).send({
            status: 'success',
            error: false,
            message: "Topic delete",
            topicDeleted: topicDeleted,

        });
    } catch (error) {
        console.error('delete topic error:', error);
        return res.status(500).send({
            status: 'error',
            error: true,
            message: 'Error when try delete topic: ' + error,
        });
    }


};


/**
 * @description Topic search.
 * @param req
 * @param res
 * @return {Promise<*>}
 */
exports.search = async (req, res) => {
    /*
    // Sacar string a buscar de la url
		var searchString = req.params.search;

		// Find or
		Topic.find({ "$or": [
			{ "title": { "$regex": searchString, "$options": "i"} },
			{ "content": { "$regex": searchString, "$options": "i"} },
			{ "code": { "$regex": searchString, "$options": "i"} },
			{ "lang": { "$regex": searchString, "$options": "i"} }
		]})
		.populate('user')
		.sort([['date', 'descending']])
		.exec((err, topics) => {

			if(err){
				return res.status(500).send({
					status: 'error',
					message: 'Error en la petición'
				});
			}

			if(!topics){
				return res.status(404).send({
					status: 'error',
					message: 'No hay temas disponibles'
				});
			}

			return res.status(200).send({
				status: 'success',
				topics
			});

		});
	}
    * */
    try {} catch (error) {}
};
