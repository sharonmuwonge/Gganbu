var defineAttribute = require("./defineAttribute")
var extend = require("../util/extend")

var managers = {}

/**
 * Defines attributes on a prototype
 * Registers onChangeCallbacks on a hash
 * Registers default values on a hash
 * */
module.exports = function createAttributes( elementName, inherits, proto, attributes ){
  var def
  var attrManager = new AttributeManager(managers[inherits]||{})
  managers[elementName] = attrManager
  for( var name in attributes ){
    if( attributes.hasOwnProperty(name) ){
      def = attributes[name]
      proto[name] = defineAttribute(name, def, attrManager)
    }
  }

  return attrManager
}

function AttributeManager( attributeManager ){
  this.defaultValues = extend({}, attributeManager.defaultValues)
  this.attributeDefaults = extend({}, attributeManager.attributeDefaults)
  this.onChangedCallbacks = extend({}, attributeManager.onChangedCallbacks)
}
AttributeManager.prototype.addDefaultValue = function( attributeName, defaultValue ){
  this.defaultValues[attributeName] = defaultValue
}
AttributeManager.prototype.addOnChangedCallback = function( attributeName, onChangedCallback ){
  this.onChangedCallbacks[attributeName] = onChangedCallback
}
/**
 * If a handler exists with the given name it executes the handler.
 * The callback is called in the element's context
 * and receives the previous and the current value as arguments.
 * */
AttributeManager.prototype.callOnChangedCallback = function( element, name, previousValue, value ){
  var handler = this.onChangedCallbacks[name]
  if( handler ) handler.call(element, previousValue, value)
}
/**
 * Iterates on a hash of default values,
 * and applies these name-value pairs as attributes on an element.
 * */
AttributeManager.prototype.setDefaultValues = function( element ){
  var defaults = this.defaultValues
  var defaultValue
  for( var attrName in defaults ){
    if( defaults.hasOwnProperty(attrName) ){
      defaultValue = defaults[attrName]
      var useAttributeAsDefault = this.attributeDefaults[attrName]
      if( useAttributeAsDefault || defaultValue === "attribute" ){
        if( attrName in element ){
          defaultValue = element[attrName]
        }
        else{
          defaultValue = element.getAttribute(attrName)
        }
      }

      if (defaultValue != null) {
        if( attrName in element ){
          element[attrName] = defaultValue
        }
        else {
          element.setAttribute(attrName, defaultValue)
        }
      }
    }
  }
}
