(function (window) {
    "use strict";

    var nof5 = window.nof5,
        mocha = window.mocha;

    jQuery(function onReady() {

        nof5.connect(function onConnect(socket) {

            jQuery("#mocha").empty();

            mocha.setup({
                ui:"bdd",
                globals: [
                    "io",
                    "getInterface", //getInterface seems to a global function from mocha ^^
                    "stats",
                    "report"
                ]
            });

            mocha.Runner.prototype.on("suite", function (suite) {
                if(suite.root) {
                    socket.emit("start", new Date());
                }
            });

            mocha.Runner.prototype.on("fail", function onFail(test) {

                mocha.Runner.prototype.once("test end", function onTestEnd() {

                    var error = {
                        "suite": test.parent.title,
                        "test": test.title,
                        "type": test.err.toString()
                    };

                    socket.emit("fail", error);
                });
            });

            mocha.Runner.prototype.on("suite end", function onSuiteEnd(suite) {
                if (suite.root) {
                    socket.emit("end", new Date());
                    mocha.Runner.prototype.removeAllListeners("test end");
                }
            });

            function onf5() {

                console.log(new Date().toLocaleTimeString() + ": re-running tests");

                var oldTests = jQuery("script[src='tests.js']");

                if (oldTests.length !== 0) {
                    jQuery("script[src='tests.js']").remove();
                }

                jQuery.getScript("tests.js", function onTestsLoaded() {

                    jQuery("#mocha").empty();

                    nof5.enableTests();
                    mocha.run();

                    socket.once("f5", onf5);

                });
            }

            socket.on("disconnect", function onDisconnect() {
                mocha.Runner.prototype.removeAllListeners();
            });

            //Run tests initially
            onf5();
        });
    });

})(window);