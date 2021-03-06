"use strict";

var expect = require("expect.js"),
    path = require("path"),
    rewire = require("rewire"),
    sanitizeConfig = rewire("../../../lib/core/config/sanitizeConfig.js");

var processMock = Object.create(process);

processMock.cwd = function () {
    return __dirname + "/sanitizeConfig";
};

sanitizeConfig.__set__("process", processMock);

describe("sanitizeConfig", function () {
    var config,
        sanitizedConfig;

    before(function () {
        sanitizeConfig.log = function () { /* do nothing. we don't want to spill the console when testing */ };
    });

    beforeEach(function () {
        config = {
            "port" : 1223,
            "appDir" :processMock.cwd(),
            "logDir" :processMock.cwd() +  "/log"
        };
    });

    describe("#port", function () {

        it("should cast strings to numbers", function () {
            config.port = "1234";
            sanitizedConfig = sanitizeConfig(config);
            expect(sanitizedConfig.port).to.be(1234);
        });

        it("should throw an error when port has uncastable type", function () {
            config.port = "ABX";
            expect(function() { sanitizeConfig(config); }).to.throwError();
        });

        it("should throw an error when port is not set", function () {
            delete config.port;
            expect(function() { sanitizeConfig(config); }).to.throwError();
        });

        it("should throw an error when port is null", function () {
            config.port = null;
            expect(function() { sanitizeConfig(config); }).to.throwError();
        });
    });

    describe("#appDir", function () {

        it("should take the folder if passed", function () {
            sanitizedConfig = sanitizeConfig(config);

            expect(sanitizedConfig.appDir).to.be(config.appDir);
        });

        it("should take the CWD if dir is not set", function () {
            delete config.appDir;
            sanitizedConfig = sanitizeConfig(config);
            expect(sanitizedConfig.appDir).to.be(processMock.cwd());
        });

        it("should add paths as object for app-dir", function(){
            expect(sanitizedConfig.paths).to.be.an("object");
        });
    });

    describe("#logDir", function () {

        it("should take the folder if passed", function () {
            sanitizedConfig = sanitizeConfig(config);
            expect(sanitizedConfig.logDir).to.be(config.logDir);
        });

        it("should take the APPDir/log if dir is not set", function () {
            var appDir = config.appDir;

            delete config.appDir;
            sanitizedConfig = sanitizeConfig(config);
            expect(sanitizedConfig.logDir).to.be(path.join(appDir, "log"));
        });
    });
});