"use strict";

// Import mongoose module
const app = require("./app");
const mongoose = require("mongoose");

// ************************** Load .env file ******************* //
require("dotenv").config();

const configDB = require("./app/config/db.config");
const configServer = require("./app/config/server.config");

process.env.TZ = "Europe/Madrid";
const URI_CONNECT_CLOUD_MONGODB = configDB.mongoCloud;
const URI_CONNECT_MONGODB = `mongodb://${configDB.hostname}:${configDB.portMongoDB}/${configDB.database}`;


// Connection with DB
mongoose.set("useFindAndModify", false);
mongoose.Promise = global.Promise;
mongoose
    .connect(URI_CONNECT_CLOUD_MONGODB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log(`Mongoose version: ${mongoose.version}.`);
        console.log("Database connection successful.");

        // Create  http server
        app.listen(configServer.portServer, configServer.hostname, (err) => {
            console.log(`Server connection successful -> url:http://${configServer.hostname}:${configServer.portServer} se estableció correctamente`);
            console.log("MongoDB-Cloud cluster0 connection successful -> mongodb+srv://root:****@cluster0.x1uny.mongodb.net/api_rest_node");
            //console.log('CORS-enabled web server listening on port 3099')
            if (err){
                console.error("Http server listen error", err);
                process.exit();
            }
        });
    })
    .catch((error) => {
        console.error("Database connection error", error);
        process.exit();
    });
