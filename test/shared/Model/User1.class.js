
var Class = require("nodeclass").Class;
var Model = require('../../../lib/shared/Model.class.js');

var schema = {
    name: {
        type : String,
        default : "John Wayne"
    },
    age: {
        type : Number,
        default : 45
    },
    kills: Number
};

var User1 = new Class({
    Extends : Model,
    "init": function() {
        this.Super(__filename, schema);
        this.Super._setSchema(schema);
    },
    "getService": function() {
        return null;
    },
    "getValidator": function() {
        return null;
    },
    "accept": function() {
        this.Super.acceptCurrentState();
    }
});

module.exports = User1;