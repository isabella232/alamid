"use strict";

var router = require("../router.js"),
    routes = require("../../shared/config.js").routes,
    env = require("../../shared/env.js"),
    log = require("../../shared/logger").get("server");

//middleware
var runService = require("./middleware/runService.js"),
    runValidator = require("./middleware/runValidator.js"),
    loadModel = require("./middleware/loadModel.js"),
    isValidRequest = require("./middleware/isValidRequest.js"),
    sanitizeData = require("./middleware/sanitizeData.js");

function attachAlamidMiddleware() {

    var routeHandler = router.get("alamid");

    //ALL REQUESTS
    routeHandler.addAlamidRoute(["create", "read", "update", "destroy"], "/*", [isValidRequest]);

    //SERVICES
    routeHandler.addAlamidRoute(["create", "read", "update", "destroy"], routes.services + "/*", [loadModel, runService]);

    //VALIDATORS
    routeHandler.addAlamidRoute("create", routes.validators + "/*", [runValidator]);

    //Alamid-Pipeline Error handler
    routeHandler.on("error", function (err, req, res) {

        var errorMessage = "(alamid) Internal Server Error '" + req.getMethod().toUpperCase() + "' '" + req.getRawPath() + "' (" + req.getTransportType() + ") '" + err.message + "'";

        //log in any case
        log.error(errorMessage);

        //don't expose the message in production mode
        if (env.isProduction()) {
            errorMessage = "Internal Server Error.";
        }

        res.end({
            status: "error",
            message: errorMessage,
            data: {
                errorCode: "serverError"
            }
        });
    });
}

module.exports = attachAlamidMiddleware;