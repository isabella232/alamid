"use strict";

var path = require("path"),
    util = require("util");

var parseMiddlewareObject = require("./parseMiddlewareObject.js");

function collectMiddleware(middlewarePath, callback) {

    //console.log(middlewarePath);
    var middlewareDefinitions;

    path.exists(path.resolve(__dirname, middlewarePath), function(exists){

        if(!exists) {
            callback(new Error("No Middlewares found on path: ", middlewarePath), {});
            return;
        }

        middlewareDefinitions = require(middlewarePath);
        callback(null, parseMiddlewareObject(middlewareDefinitions));
    });
}

module.exports = collectMiddleware;