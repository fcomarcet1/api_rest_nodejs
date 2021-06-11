'use strict';
// module that sanitizes inputs against query selector injection attacks
const sanitize = require("mongo-sanitize");

/**
 * Sanitizes inputs against query selector injection attacks
 * @param req
 * @param res
 * @param next
 * @return {*}
 */
module.exports = (req, res, next) => {
  try {
    req.body = sanitize(req.body);
    next();
  } catch (error) {
    console.log("clean-body-error", error);
    return res.status(500).json({
      error: true,
      message: "Could not sanitize body",
    });
  }
};
