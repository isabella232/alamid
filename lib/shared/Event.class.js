"use strict"; // run code in ES5 strict mode

var Class = require("alamid-class"),
    value = require("value");

/**
 * Represents an event that will be passed to every event listener as first parameter.
 *
 * @class Event
 */
var Event = new Class("Event", {

    /**
     * The object that emitted the event.
     *
     * @type {Object}
     */
    target: null,

    /**
     * @type {Boolean}
     * @private
     */
    _defaultPrevented: false,

    /**
     * @param {Object} target
     * @constructor
     */
    constructor: function (target) {
        if (value(target).isNotSet()) {
            throw new TypeError("(alamid) Cannot create event: You haven't specified a target");
        }
        this.target = target;
    },

    /**
     * Returns true if .preventDefault() has been called at least once
     * @return {Boolean}
     */
    isDefaultPrevented: function () {
        return this._defaultPrevented;
    },

    /**
     * Tells the event emitter to cancel the progress
     * @return {Event}
     */
    preventDefault: function () {
        this._defaultPrevented = true;
        return this;
    }
});

module.exports = Event;