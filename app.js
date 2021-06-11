"use strict";

// ********************* IMPORT MODULES *************************
const nodeinfo = require('nodejs-info');
const express = require("express");
const bodyParser = require("body-parser");
//const cors = require("cors");


// Execute Express
const app = express();
process.env.TZ = "Europe/Madrid";

// public folder (css, js)
app.use(express.static('public'));


// **************** LOAD FILE ROUTES ************************
//var adminRoutes = require("./app/routes/admin.routes");
const authRoutes = require("./app/routes/auth.routes");
const userRoutes = require("./app/routes/user.routes");
const uploadRoutes = require("./app/routes/upload.routes");
const topicRoutes = require("./app/routes/topic.routes");
const commentRoutes = require("./app/routes/comment.routes");


// ******************* MIDDLEWARES ******************************
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// ********************* CORS ***********************************
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
    next();
});


// *************************** TEST ROUTES **************************
app.get("/ping", (req, res) => {
    return res.send({
        status: "success",
        error: false,
        message: "Server is healthy",
    });
});

app.get("/server-info", (req, res) => {
    res.send(nodeinfo(req));
});


// ******************* REWRITE PATH ROUTES /api/url/register /api/users/show ************************
//app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", topicRoutes);
app.use("/api", commentRoutes);



// Export module
module.exports = app;
