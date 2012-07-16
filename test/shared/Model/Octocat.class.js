
var Class = require("nodeclass").Class;
var Model = require('../../../lib/shared/Model.class.js'),
    schema = require("./schemas/OctocatSchema.js");

var Octocat = new Class({
    Extends : Model,
    "init": function() {
        this.Super(__filename, schema);
        this.Super._setSchema(schema);
    },
    "accept": function() {
        this.Super.acceptCurrentState();
    }
});

module.exports = Octocat;