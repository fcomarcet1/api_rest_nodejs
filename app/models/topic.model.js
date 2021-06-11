"use strict";

const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2")
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;


// Comment Model
const CommentSchema = new Schema(
    {
        content: {
            type: String,
            trim: true,
            required: true,
        },
        user: {type: Schema.ObjectId, ref: "User"},
    },
    {timestamps: true}
);

// if we need export comment object
var Comment = mongoose.model("Comment", CommentSchema);

// Topic Model
const TopicSchema = new Schema(
    {
        topicId: {
            type: String,
            unique: true,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            trim: true,
            required: [true, "can't be blank"],
            match: [/^[a-zA-Z0-9*/@{}<>. ]+$/, "is invalid"],
        },
        content: {
            type: String,
            trim: true,
            required: [true, "can't be blank"],
            //match: [/^[a-zA-Z0-9*/@{}<>. ]+$/, "is invalid"],
        },
        code: {
            type: String,
            trim: true,
        },
        lang: {
            type: String,
            trim: true,
        },
        user: {type: Schema.ObjectId, ref: "User"},
        comments: [CommentSchema],
        /*comments: {type: Schema.Types.ObjectId, ref: "Comment"}*/
    },
    {timestamps: true}
);


// Do not show fields with private information
TopicSchema.methods.toJSON = function () {

    let obj = this.toObject();
    delete obj.__v ;

    return obj;
}

// Load plugins
TopicSchema.plugin(uniqueValidator, {message: "is already taken."});
TopicSchema.plugin(mongoosePaginate);

// Export schema
module.exports = mongoose.model("Topic", TopicSchema);
//module.exports = mongoose.model("Comment", CommentSchema);
