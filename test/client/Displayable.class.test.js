"use strict";

var expect = require("../testHelpers/expect.jquery.js"),
    value = require("value"),
    path = require("path"),
    Displayable = require("../../lib/client/Displayable.class.js"),
    domAdapter = require("../../lib/client/helpers/domAdapter.js"),
    jQuery = require("../testHelpers/jquery.js"),
    collectNodeReferences = require("../testHelpers/collectNodeReferences.js");

var checkTypeError = require("../testHelpers/checkError.js")(TypeError);

describe("Displayable", function () {

    var form,
        formTemplate =
            "<form data-node='form' action='?' method='post'>" +
                "<input data-node='inputA' type='text' value='a'/>" +
                "<input data-node='inputB' type='text' value='b'/>" +
                "<input data-node='inputC' type='button' value='c'/>" +
            "</form>",
        submitButton,
        cssClassHide = Displayable.prototype.cssClassHide;

    beforeEach(function () {

        submitButton = new Displayable(
            "<input data-node='submitButton' type='submit' value='submit'/>"
        );
        form = new Displayable(formTemplate);

    });

    describe("#constructor()", function () {
        var MyDisplayable = Displayable.extend({
                template: "<p></p>"
            });

        it("should throw an error if a template has more than one nodes", function () {
            expect(function () {
                var displayable = new Displayable("<p></p><div></div>");
            }).to.throwError();
        });

        it("should throw an error if a template has no valid root node", function () {
            expect(function () {
                var displayable = new Displayable("<!-- I'm not a valid root node -->");
            }).to.throwError();
        });

        it("should apply the passed template in favor of the Displayable's template", function () {
            var myDisplayable = new MyDisplayable("<ol></ol>");

            expect(myDisplayable.getRoot()).to.be.an(HTMLOListElement);
        });

        it("should apply the passed node in favor of the Displayable's template", function () {
            var ol = document.createElement("ol"),
                myDisplayable = new MyDisplayable(ol);

            expect(myDisplayable.getRoot()).to.be.an(HTMLOListElement);
        });

        it("should apply Displayable.prototype.template as default template if nothing has been passed", function () {
            var myDisplayable = new Displayable();

            expect(myDisplayable.getRoot()).to.eql(Displayable.prototype.template);
        });

    });

    describe("#template", function () {
        
        it("should be '<div data-node=\"root\"></div>' by default", function () {
            expect(new Displayable().template).to.be('<div data-node="root"></div>');
        });
        it("should apply the Displayable's template if no template was passed", function () {
            expect(submitButton.getRoot()).to.be.an(HTMLInputElement);
        });
        it("should not be a problem to have comments or white spaces at the beginning or end of the template", function () {
            var displayable = new Displayable("<!-- This is a comment-->   <p></p>     ");
            expect(displayable.getRoot()).to.be.a(HTMLParagraphElement);
        });

    });

    describe("#domEvents", function () {

        it("should attach all dom events to the nodes", function () {
            var inputAClick = "untriggered",
                inputBClick = "untriggered",
                MyDisplayable,
                myDisplayable;

            MyDisplayable = Displayable.extend({
                template: formTemplate,
                domEvents: {
                    inputA: {
                        click: function () {
                            inputAClick = "triggered";
                        }
                    },
                    inputB: {
                        click: function () {
                            inputBClick = "triggered";
                        }
                    }
                }
            });
            myDisplayable = new MyDisplayable();

            myDisplayable.getNode("inputA").click();
            myDisplayable.getNode("inputB").click();

            expect(inputAClick).to.be("triggered");
            expect(inputBClick).to.be("triggered");
        });

        it("should call the handlers bound to the displayable if defined as string", function(done) {
            var MyDisplayable,
                myDisplayable;

            MyDisplayable = Displayable.extend({
                template: formTemplate,
                domEvents: {
                    inputA: {
                        click: "_onFocus"
                    }
                },
                _onFocus: function (event) {
                    expect(this).to.be(myDisplayable);
                    expect(event.target).to.be(this.getNode("inputA")[0]);
                    done();
                }
            });
            myDisplayable = new MyDisplayable();

            myDisplayable.getNode("inputA").click();
        });

    });

    describe("#getRoot()", function () {

        it("should return the root node according to the given template", function () {
            expect(form.getRoot()).to.be.an(HTMLFormElement);
        });

        it("should wrap it with domAdapter.$", function () {
            expect(form.getRoot() instanceof domAdapter.$).to.be(true);
        });

    });
    
    describe("#getParent()", function () {
        
        it("should return null if the displayable is not a child", function () {
            expect(form.getParent()).to.be(null);
        });
        
        it("should return the parent displayable where this displayable has been added to", function () {
            form.append(submitButton).at("form");
            expect(submitButton.getParent()).to.be(form);
        });
        
    });
    

    describe("#getNode()", function () {

        it("should wrap all nodes with domAdapter.$", function () {
            expect(form.getNode("form") instanceof domAdapter.$).to.be(true);
        });

        it("should return all nodes declared with data-node", function () {
            expect(form.getNode("form")).to.be.an(HTMLFormElement);
            expect(form.getNode("inputA")).to.be.an(HTMLInputElement);
            expect(form.getNode("inputB")).to.be.an(HTMLInputElement);
            expect(form.getNode("inputC")).to.be.an(HTMLInputElement);
        });

        it("should return null if there is no node with the given name", function () {
            expect(form.getNode("does-not-exist")).to.be(null);
        });

        it("should be possible to get the 'root' if no template was given", function () {
            form = new Displayable();
            expect(form.getNode("root")).to.be(form.getRoot());
        });

        it("should throw a TypeError if no string was given", function () {
            expect(function () {
                form.getNode();
            }).to.throwError(checkTypeError);
        });

    });

    describe("#append().at()", function () {

        it("should throw an Error if an object not kind of Displayable is given", function () {
            expect(function () {
                form.append({}).at("form");
            }).to.throwError();
        });

        it("should throw an Error if a not existent node name was passed to at()", function () {
            expect(function () {
                form.append(submitButton).at("not_existing_node");
            }).to.throwError();
        });

        it("should return a reference to itself", function () {
            expect(form.append(submitButton).at("form")).to.be(form);
        });

        it("should append submit-button to form", function () {
            form.append(submitButton).at("form");
            expect(form.getRoot()[0].lastChild).to.be(submitButton.getRoot());
        });

        it("should emit a 'child'-event", function (done) {
            form.on("child", function (event) {
                expect(event.target).to.be(form);
                expect(event.child).to.be(submitButton);
                done();
            });

            form.append(submitButton).at("form");
        });

        it("should emit a 'document'-event if the parent displayable is in the document", function (done) {
            form.isInDocument = function () { return true; };

            submitButton.on("document", function onDom(event) {
                expect(event.name).to.be("DocumentEvent");
                expect(event.target).to.be(submitButton);
                done();
            });

            form.append(submitButton).at("form");
        });

        it("should emit no 'document'-event if the parent displayable is not in the dom", function () {
            submitButton.on("document", function onDom() {
                throw new Error("This function should not be called");
            });

            form.append(submitButton).at("form");
        });

    });

    describe("#prepend().at()", function () {

        it("should throw an Error if a not existent node name was passed to # at()", function () {
            expect(function () {
                form.prepend({}).at("form");
            }).to.throwError();
        });

        it("should throw an Error if a not existent node name was passed to # at()", function () {
            expect(function () {
                form.prepend(submitButton).at("not_existing_node");
            }).to.throwError();
        });

        it("should return a reference to itself", function () {
            expect(form.prepend(submitButton).at("form")).to.be(form);
        });

        it("should prepend submit-button to form", function () {
            form.prepend(submitButton).at("form");
            expect(form.getRoot()[0].firstChild).to.be(submitButton.getRoot());
        });

        it("should emit a 'child'-event", function (done) {
            form.on("child", function (event) {
                expect(event.target).to.be(form);
                expect(event.child).to.be(submitButton);
                done();
            });

            form.prepend(submitButton).at("form");
        });

        it("should emit a 'document'-event if the parent displayable is in the dom", function (done) {
            form.isInDocument = function () { return true; };

            submitButton.on("document", function onDom(event) {
                expect(event.name).to.be("DocumentEvent");
                expect(event.target).to.be(submitButton);
                done();
            });

            form.prepend(submitButton).at("form");
        });

        it("should emit no 'document'-event if the parent displayable is not in the dom", function () {
            submitButton.on("document", function onDom() {
                throw new Error("This function should not be called");
            });

            form.prepend(submitButton).at("form");
        });

    });

    describe("#detach()", function () {

        it("should return a reference to itself", function () {
            expect(submitButton.detach()).to.be(submitButton);
        });

        it("should emit a 'detach'-event when it's actually detached", function (done) {
            form.append(submitButton).at("form");
            submitButton.on("detach", function () {
                done();
            });
            submitButton.detach();
        });

        it("should emit no 'detach'-event when it's not actually detached", function () {
            submitButton.on("detach", function () {
                throw new Error("This function should not be called");
            });
            submitButton.detach();
        });

        it("should be possible to call .detach() on an detached displayable without error", function () {
            submitButton.detach();
            submitButton.detach();
            submitButton.detach();
        });

        it("should detach itself from parent node", function () {
            form.append(submitButton).at("form");
            submitButton.detach();
            expect(form.find("[type='submit']")).to.have.length(0);
        });

        it("should remove the parent reference after detaching", function () {
            form.append(submitButton).at("form");
            expect(submitButton.getParent()).to.be(form);
            submitButton.detach();
            expect(submitButton.getParent()).to.be(null);
        });

        it("should remove the reference from the _children-array", function () {
            form.append(submitButton).at("form");
            submitButton.detach();
            expect(form._children).to.not.contain(submitButton);
        });

        it("should still be possible to trigger attached events after .detach()", function (done) {
            var submitButtonNode = submitButton.getNode("submitButton");

            submitButtonNode.on("click", function (event) {
                event.preventDefault();
                done();
            });

            form.append(submitButton).at("form");
            submitButton.detach();
            submitButtonNode.click();
        });

        it("should be possible to re-append a detached Displayable", function (done) {
            var submitButtonNode = submitButton.getNode("submitButton");

            submitButtonNode.on("click", function (event) {
                event.preventDefault();
                done();
            });

            form.append(submitButton).at("form");
            submitButton.detach();
            form.append(submitButton).at("form");
            expect(form.getRoot()).to.contain(submitButton.getRoot());
            submitButtonNode.click();
        });

        it("should not leave any event listeners on a child", function () {
            var len,
                eventName,
                listeners,
                expectedListeners = [],
                actualListeners = [];

            for (eventName in submitButton._events) {
                if (submitButton._events.hasOwnProperty(eventName)) {
                    listeners = submitButton._events[eventName];
                    len = value(listeners).typeOf(Array)? listeners.length: 1;
                    expectedListeners.push(len);
                }
            }
            form.append(submitButton).at("form");
            submitButton.detach();
            for (eventName in submitButton._events) {
                if (submitButton._events.hasOwnProperty(eventName)) {
                    listeners = submitButton._events[eventName];
                    len = value(listeners).typeOf(Array)? listeners.length: 1;
                    actualListeners.push(len);
                }
            }
            expect(actualListeners).to.eql(expectedListeners);
        });

    });

    describe("#dispose()", function () {
        var disp1,
            disp2,
            disp3;

        beforeEach(function () {
            disp1 = new Displayable();
            disp2 = new Displayable();
            disp3 = new Displayable();
            form.append(submitButton).at("form");
            form.append(disp1).at("form");
            form.append(disp2).at("form");
            form.append(disp3).at("form");
        });

        it("should NOT return a reference to itself", function () {
            expect(submitButton.dispose()).to.be(undefined);
        });

        it("should emit an 'detach'-Event before it disposes itself when it's a child displayable", function (done) {
            submitButton.on("detach", function onDetach() {
                done();
            });
            submitButton.dispose();
        });

        it("should emit an 'dispose'-Event", function (done) {
            submitButton.on("dispose", function () {
                done();
            });
            submitButton.dispose();
        });

        it("should detach itself from parent node", function () {
            submitButton.dispose();
            expect(form.getRoot()[0].lastChild).to.not.be(submitButton);
        });

        it("should NOT be possible to get the root", function () {
            submitButton.dispose();
            expect(submitButton.getRoot()).to.be(null);
        });

        it("should NOT be possible to get nodes", function () {
            submitButton.dispose();
            expect(submitButton.getNode("submitButton")).to.be(null);
        });

        it("should remove all dom event listeners from data-nodes and the root", function () {
            var displayable = new Displayable(
                    '<div>' +
                        '<input type="button" data-node="button">' +
                    '</div>'
                ),
                button = displayable.getNode("button"),
                root = displayable.getRoot();

            function throwError() {
                throw new Error("This function should not be called");
            }

            button.on("click", throwError);
            root.on("click", throwError);
            root.delegate("input", "click", throwError);

            displayable.dispose();
            button.click();
            root.click();
        });

        it("should NOT be possible to re-append a disposed Displayable", function () {
            submitButton.dispose();

            expect(function () {
                form.append(submitButton).at("form");
            }).to.be.throwError();
        });

        it("should be callable multiple times", function () {
            submitButton.dispose();
            submitButton.dispose();
        });

        it("should emit an 'detach'-event only on first call", function (done) {
            submitButton.on("detach", function beforeDispose() {
                done();
            });
            submitButton.dispose();

            submitButton.on("detach", function beforeDispose() {
                throw new Error("This function should not be called");
            });
            submitButton.dispose();
        });

        it("should emit an 'dispose'-event only on first call", function (done) {
            submitButton.on("dispose", function dispose() {
                done();
            });
            submitButton.dispose();

            submitButton.on("dispose", function dispose() {
                throw new Error("This function should not be called");
            });
            submitButton.dispose();
        });

        it("should call dispose() on all children", function () {
            var called = {},
                submitButtonDispose = submitButton.dispose,
                disp1Dispose = disp1.dispose,
                disp2Dispose = disp2.dispose,
                disp3Dispose = disp3.dispose;

            submitButton.dispose = function () {
                called.submitButton = true;
                submitButtonDispose.call(this);
            };
            disp1.dispose = function () {
                called.disp1 = true;
                disp1Dispose.call(this);
            };
            disp2.dispose = function () {
                called.disp2 = true;
                disp2Dispose.call(this);
            };
            disp3.dispose = function () {
                called.disp3 = true;
                disp3Dispose.call(this);
            };

            form.dispose();

            expect(called).to.only.have.keys(["submitButton", "disp1", "disp2", "disp3"]);
        });

        it("should remove all node references", function () {
            var nodeRefs;

            form.dispose();
            nodeRefs = collectNodeReferences(form)
                .concat(collectNodeReferences(disp1))
                .concat(collectNodeReferences(disp2))
                .concat(collectNodeReferences(disp3));
            expect(nodeRefs).to.be.empty();
        });

    });

    describe("#hide()", function () {

        it("should apply the css class '" + cssClassHide + "'", function () {
            form.hide();
            expect(form.getRoot()).to.have.cssClass(cssClassHide);
        });

    });

    describe("#show()", function () {

        it("should remove the css class '" + cssClassHide + "'", function () {
            form.show();
            expect(form.getRoot()).to.not.have.cssClass(cssClassHide);
        });

    });

    describe("#toggle()", function () {

        it("should hide if already shown", function () {
            form.show();
            expect(form.getRoot()).to.not.have.cssClass(cssClassHide);
            form.toggle();
            expect(form.getRoot()).to.have.cssClass(cssClassHide);
        });

        it("should show if been hidden", function () {
            form.hide();
            expect(form.getRoot()).to.have.cssClass(cssClassHide);
            form.toggle();
            expect(form.getRoot()).to.not.have.cssClass(cssClassHide);
        });

        it("should force show if called with true", function () {
            form.show();
            expect(form.getRoot()).to.not.have.cssClass(cssClassHide);
            form.toggle(true);
            expect(form.getRoot()).to.not.have.cssClass(cssClassHide);
        });

        it("should not emit an event if the state hasn't changed", function() {
            var eventCnt = 0;

            form.hide();

            form.on("show", function() {
                eventCnt++;
            });

            form.show();
            form.show();
            form.show();

            expect(eventCnt).to.be(1);
        });

        it("should be possible to pass non-boolean types", function () {
            form.toggle("show me the form please");
            expect(form.getRoot()).to.not.have.cssClass(cssClassHide);
            form.toggle(0);
            expect(form.getRoot()).to.have.cssClass(cssClassHide);
            form.toggle(form);
            expect(form.getRoot()).to.not.have.cssClass(cssClassHide);
        });
    });

    describe("#isVisible()", function () {

        it("should be true by default value", function () {
            expect(form.isVisible()).to.be(true);
        });

        it("should be false after .hide()", function () {
            form.hide();
            expect(form.isVisible()).to.be(false);
        });

        it("should be true after .hide() and then .show()", function () {
            form.hide();
            form.show();
            expect(form.isVisible()).to.be(true);
        });

    });
    
    describe("#isInDocument()", function () {
        var mainPage;
        
        it("should be false by default", function () {
            expect(form.isInDocument()).to.be(false);
        });

        it("should be true if the displayable has been added to the dom manually", function () {
            mainPage = new Displayable(document);
            expect(mainPage.isInDocument()).to.be(true);
            mainPage = new Displayable(document.body.firstChild);
            expect(mainPage.isInDocument()).to.be(true);
        });

        it("should be true if one of the parents is in the document", function () {
            mainPage = new Displayable();
            mainPage.isInDocument = function () { return true; };
            mainPage.append(form).at("root");
            expect(form.isInDocument()).to.be(true);
        });

        it("should be false after the displayable has been detached again", function () {
            mainPage = new Displayable();
            mainPage.isInDocument = function () { return true; };
            mainPage.append(form).at("root");
            form.detach();
            expect(form.isInDocument()).to.be(false);
        });
        
    });
    

    describe("#find()", function () {

        it("should perform a css query on the root node", function () {
            var match,
                displayable = new Displayable(
                    "<div>" +
                        "<p></p>" +
                        "<em class='hello'></em>" +
                        "<h1 id='article-headline'></h1>" +
                        "</div>"
                ),
                root = displayable.getRoot()[0],
                p = root.childNodes[0],
                em = root.childNodes[1],
                h1 = root.childNodes[2];

            match = displayable.find("div");
            expect(match).to.have.length(1);
            expect(match[0]).to.be(root);

            match = displayable.find("p");
            expect(match).to.have.length(1);
            expect(match[0]).to.be(p);

            match = displayable.find(".hello");
            expect(match).to.have.length(1);
            expect(match[0]).to.be(em);

            match = displayable.find("#article-headline");
            expect(match).to.have.length(1);
            expect(match[0]).to.be(h1);
        });

    });

    describe("#emit()", function () {

        it("should emit the 'document'-event first and then on all children", function () {
            var called = "",
                docEvent = {},
                displayable = new Displayable();

            submitButton.on("document", function (event) {
                called += " submitButton ";
                expect(event.name).to.be("DocumentEvent");
                expect(event.target).to.be(submitButton);
            });

            displayable.on("document", function (event) {
                called += "displayable";
                expect(event.name).to.be("DocumentEvent");
                expect(event.target).to.be(displayable);
            });

            form.on("document", function (event) {
                called += "form";
                expect(event).to.be(docEvent);
            });

            form.append(submitButton).at("form");
            form.append(displayable).at("form");
            form.emit("document", docEvent);
            expect(called).to.be("form submitButton displayable");
        });

    });

});