"use strict"; // run code in ES5 strict mode

var expect = require("expect.js"),
    value = require("value"),
    pageJS = require("page"),
    Client = require("../../lib/client/Client.class.js"),
    MainPage = require("../../lib/client/MainPage.class.js");

describe("Client", function () {

    var client,
        path;

    beforeEach(function () {
        client = new Client();

        pageJS.callbacks = [];  // removes previous routes
        path = window.location.pathname + window.location.search;
    });

    afterEach(function () {
        history.replaceState(null, null, path);
        if (client.mainPage) {
            client.mainPage.dispose();
        }
    });

    describe("#constructor() / .instance", function () {

        it("should return an instance of Client", function () {
            client = new Client();
            expect(client).to.be.an(Client);
        });

        it("should add the instance to the Client-function", function () {
            expect(Client.instance).to.be(client);
        });

    });

    describe("#start() / .mainPage", function () {
        var MyMainPage;

        it("should create an instance of MainPage by default", function () {
            client.start();
            expect(client.mainPage).to.be.a(MainPage);
        });

        it("should also be possible to provide an own MainPage", function () {
            MyMainPage = MainPage.extend("MyMainPage");

            client.mainPage = new MyMainPage({}, document);
            client.start();
            expect(client.mainPage).to.be.a(MyMainPage);
        });

    });

    describe("#dispatchRoute()", function () {

        afterEach(function () {
            pageJS.stop();
        });

        it("should modify the history state", function () {
            // This route handler is needed so pageJS doesn't trigger a page reload
            client.addRoute("*", function () {
                //do nothing
            });

            client.dispatchRoute("/blog/posts");
            expect(window.location.pathname).to.be("/blog/posts");
        });

        it("should call automatically .start() with {dispatch: false} if it was not called manually", function () {
            var startParams,
                pageJSStart = pageJS.start;

            //Apply monkey patch to .start()
            pageJS.start = function (params) {
                startParams = params;
            };

            client.addRoute("blog", function () {
                //do nothing
            });

            client.dispatchRoute("blog");

            expect(startParams.dispatch).to.be(false);

            //Revert monkey patch .start()
            pageJS.start = pageJSStart;
        });
    });

    describe("#addRoute()", function () {

        var pageUrl,
            context,
            pushState,
            replaceState,
            changePage;

        function noop() {}

        before(function () {
            pushState = history.pushState;
            replaceState = history.replaceState;
            changePage = MainPage.prototype.changePage;

            history.pushState = noop;
            history.replaceState = noop;
            MainPage.prototype.changePage = function (pageUrlToLoad, ctx) {
                pageUrl = pageUrlToLoad;
                context = ctx;
            };
        });

        after(function () {
            //undo monkey patches
            history.pushState = pushState;
            history.replaceState = replaceState;
            MainPage.prototype.changePage = changePage;
        });

        afterEach(function () {
            pageJS.stop();
        });

        it("should execute the added route handlers like pageJS", function () {
            var called = [];

            client
                .addRoute("*", function (ctx, next) {
                    expect(ctx).to.be.a(pageJS.Context);
                    called.push("*1");
                    next();
                })
                .addRoute(/^bl/i, function (ctx, next) {
                    called.push("/bl");
                    next();
                })
                .addRoute("blog", function (ctx, next) {
                    throw new Error("This handler should not be triggered");
                })
                .addRoute("blog/*", function (ctx, next) {
                    called.push("/blog/*");
                    next();
                })
                .addRoute("blog/posts", function (ctx, next) {
                    called.push("/blog/posts");
                    next();
                }, function (ctx, next) {
                    called.push("/blog/posts2");
                    next();
                })
                .addRoute("*", function (ctx) {
                    called.push("*2");
                });

            client.dispatchRoute("blog/posts");

            expect(called).to.eql(["*1", "/bl", "/blog/*", "/blog/posts", "/blog/posts2", "*2"]);
        });

        it("should work with a string as handler", function () {
            client.addRoute("blog/about", "blog/about");
            client.dispatchRoute("blog/about");

            expect(pageUrl).to.be("blog/about");
        });

        it("should take the route as pageUrl when passing only on argument", function () {
            client.addRoute("blog/about");
            client.dispatchRoute("blog/about");

            expect(pageUrl).to.be("blog/about");
        });

        it("should pass the params from route", function () {
            client.addRoute("blog/:author/posts/:postId", function (ctx, next) {
                expect(ctx.params.author).to.be("spook");
                expect(ctx.params.postId).to.be("123");
                next();
            });
            client.addRoute("blog/:author/posts/:postId", "blog/posts");
            client.start();
            client.dispatchRoute("blog/spook/posts/123");

            expect(context.params.author).to.be("spook");
            expect(context.params.postId).to.be("123");
        });

        it("should be chainable", function () {
            expect(client.addRoute("/blog")).to.be(client);
        });

    });

    describe("#use()", function () {

        it("should be possible to set an own instance of socket.io", function () {
            var socket = {};

            client.use("websockets", socket);
            expect(client.socket).to.be(socket);
        });

    });

});