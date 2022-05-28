/**
 * Reserved words for defining types
 * */
var typeWords = ["string", "number", "boolean", "json", "function"]

function isTypeWord( word ){
  return !!~typeWords.indexOf(word)
}

/**
 * Creates a property descriptor for an HTML attribute.
 * Registers a default value on the provided hash.
 *
 * @example
 *
 * attribute: "string"
 * attribute: "number"
 * attribute: "boolean"
 *
 * attributes: ""
 * attributes: 0
 * attributes: false
 *
 * attributes: {type: "string"}
 * attributes: {type: "number"}
 * attributes: {type: "boolean"}
 *
 * attributes: {type: ""}
 * attributes: {type: 0}
 * attributes: {type: false}
 *
 * */
module.exports = function defineAttribute( name, def, attributeManager ){
  if( def == null ){
    return
  }

  var typeOfDef = typeof def
  var simpleDef = typeOfDef != "object" // the definition is a primitive, no a config object
  var type = simpleDef
    ? def // use the definition to discern a type
    : def["type"] == null
      ? "string" // assume string as the default type if not provided
      : def["type"] // use the config value
  var typeOfType = typeof type
  type = isTypeWord(type)
    ? type
    : typeOfType
  var getter = def["get"]
  var setter = def["set"]
  var defaultValue = simpleDef
    ? isTypeWord(def)
      ? null // the definition is a reserved type word: undefined default value
      : def // use the definition as the default value
    : def["default"]
  var useAttributeAsDefault = def["attribute"]

  if( attributeManager ){
    if( typeof def["onchange"] == "function" ){
      attributeManager.addOnChangedCallback(name, def["onchange"])
    }
    if( typeof defaultValue != "undefined" && defaultValue != null ){
      attributeManager.addDefaultValue(name, defaultValue)
    }
    // use inline attribute by default
    if( useAttributeAsDefault == true || typeof useAttributeAsDefault == "undefined" || useAttributeAsDefault == null ){
      attributeManager.attributeDefaults[name] = true
    }
  }

  switch( true ){
    case type === "string":
      return {
        get: getter || function(){
          return this.getAttribute(name)
        },
        set: setter || function( value ){
          this.setAttribute(name, "" + value)
        }
      }
    case type === "number":
      return {
        get: getter || function(){
          return Number(this.getAttribute(name))
        },
        set: setter || function( value ){
          this.setAttribute(name, value)
        }
      }
    case type === "boolean":
      return {
        get: getter || function(){
          return this.hasAttribute(name)
        },
        set: setter || function( value ){
          if( !!value ) this.setAttribute(name, "")
          else this.removeAttribute(name)
        }
      }
    case type === "json":
      return {
        get: getter || function(){
          try{
            return JSON.parse(this.getAttribute(name))
          }
          catch( e ){
            return null
          }
        },
        set: setter || function( value ){
          this.setAttribute(name, JSON.stringify(value))
        }
      }
    case type == "function":
    default:
      return {
        get: getter || function(){
          return this.getAttribute(name)
        },
        set: setter || function( value ){
          this.setAttribute(name, value)
        }
      }
  }
}
