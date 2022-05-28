var register = require("./lib/register")
var delegate = require("./lib/delegate")
var fragment = require("./lib/fragment")
var components = require("./lib/components")

var fidget = {}
fidget.register = register
fidget.delegate = delegate
fidget.fragment = fragment
fidget.components = components

module.exports = fidget
