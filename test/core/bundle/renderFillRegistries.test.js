"use strict"; // run code in ES5 strict mode

var expect = require("expect.js"),
    renderFillRegistries = require("../../../lib/core/bundle/renderFillRegistries.js"),
    vm = require("vm");

var pagesPath = __dirname + "/renderFillRegistries";

describe("renderFillRegistries", function () {
    var registry = {},
        sandbox = {
            require: function (path) {
                if (path === "alamid/lib/shared/registries/pageRegistry.js") {
                    return {
                        setPage: function setPage(pageURL, pageBundle, pageDataLoader) {
                            registry[pageURL] = {
                                bundle: pageBundle,
                                dataLoader: pageDataLoader
                            };
                        }
                    };
                } else if (path === "alamid/lib/client/Page.class.js") {
                    return Page;
                }

                return function (callback) {
                    callback(path); // returning the path for testing purposes
                };
            },
            console: console
        };

    function Page(params, template) {
        this.template = template;
    }

    it("should throw no error", function () {
        var src = renderFillRegistries(pagesPath);

        vm.runInNewContext(src, sandbox);
    });
    it("should only register 'blog', 'blog/posts' and 'home'", function () {
        expect(registry).to.only.have.keys(["blog", "blog/posts", "home"]);
    });
    it("should register the page bundles", function () {
        registry["blog"].bundle(function (path) {
            expect(path).to.be("bundle!" + pagesPath + "/blog/BlogPage.class.js");
        });
        registry["blog/posts"].bundle(function (path) {
            expect(path).to.be("bundle!" + pagesPath + "/blog/posts/PostsPage.class.js");
        });
        // We have to test "home" differently because we don't have a HomePage.class.js
        registry["home"].bundle(function (page) {
            expect(page.template).to.be("bundle!" + pagesPath + "/home/HomePage.html");
        });
    });
    it("should register the data loader of 'blog'", function () {
        registry["blog"].dataLoader(function (path) {
            expect(path).to.be(pagesPath + "/blog/blogPageDataLoader.js");
        });
    });
});