var expect = require("expect.js"),
    path = require("path"),
    exec = require('child_process').exec,
    readConfig = require("../lib/core/config/readConfig.js"),
    defaultConfig = require("../lib/core/config/defaultConfig.json");

function checkConfigViaSubprocess(argv, env, done){

    exec("node " + __dirname + "/core.readConfig/readConfigWrapper.js "+ argv,
        { "env" : env },
        function (error, stdout) {

            var configJson = stdout.match(/\{(.*)\}/gi)[0];
            var parsedConf = JSON.parse(configJson);
            done(parsedConf);
        }
    );
}

describe("readConfig", function() {

    var result;

    it("should read the default config if nothing was passed", function () {
        result = readConfig();
        expect(result).to.eql(defaultConfig);
    });


    it("should read a custom config if passed via args", function (done) {

        var relativePathToTestConf = path.relative(process.cwd(), __dirname + "/core.readConfig/customConfig.json");

        checkConfigViaSubprocess("--config " + relativePathToTestConf, {}, function(parsedConf) {
            expect(parsedConf.port).to.equal(1234);
            done();
        });
    });

    it("should read a custom config if passed via env", function (done) {

        var relativePathToTestConf = path.relative(process.cwd(), __dirname + "/core.readConfig/customConfig.json");

        checkConfigViaSubprocess("", { "config" : relativePathToTestConf } , function(parsedConf) {
            expect(parsedConf.port).to.equal(1234);
            done();
        });
    });


    it("should set attributes if passed via argv", function (done) {
        checkConfigViaSubprocess("--port 9099", {} , function(parsedConf) {
            expect(parsedConf.port).to.equal(9099);
            done();
        });
    });

    it("should respect the hierachy and prefer command given via argv", function (done) {

        var relativePathToTestConf = path.relative(process.cwd(), __dirname + "/core.readConfig/customConfig.json");

        checkConfigViaSubprocess("--port 9099", { "config" : relativePathToTestConf }, function(parsedConf) {
            expect(parsedConf.port).to.equal(9099);
            done();
        });
    });

    it("should respect the hierachy and prefer command given via env before argv", function (done) {

        var relativePathToTestConf = path.relative(process.cwd(), __dirname + "/core.readConfig/customConfig.json");
        var relativePathToTestConf2 = path.relative(process.cwd(), __dirname + "/core.readConfig/customConfig2.json");

        checkConfigViaSubprocess("--config " + relativePathToTestConf2, { "config" : relativePathToTestConf }, function(parsedConf) {
            expect(parsedConf.port).to.equal(5555);
            done();
        });
    });
});