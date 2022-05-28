var forIn = require("../util/forIn")
var extend = require("../util/extend")

/**
 * Normalize an object into a descriptor
 * that can be passed to Object.create()
 * It accepts an optional array. The items of this array can be constructor functions or objects.
 * These will be used to create a base for the prototype. A kind of mixins.
 *
 * This allows for an object to have immediate members
 * and describe a prototype in a more readable manner
 * and later use the object to create a constructor prototype
 * where instance members are defined with Object.create()
 *
 * If a member value is considered a plain object, it will left untouched,
 * assuming that it's a a property descriptor already.
 *
 * @example
 *
 * this:
 * {
 *    onCreatedCallback: function(){ ... },
 *    someOtherMethod: {
 *      value: function(){ ... },
 *      enumerable: true,
 *      configurable: true
 *    }
 * }
 *
 * will be turned into this:
 * {
 *    onCreatedCallback: {
 *      value: function(){ ... }
 *    },
 *    someOtherMethod: {
 *      value: function(){ ... },
 *      enumerable: true,
 *      configurable: true
 *    }
 * }
 * */
module.exports = function createPrototype( members, augments ){
  var proto = {}
  if( augments ){
    if( !Array.isArray(augments) ){
      augments = [augments]
    }
    augments.forEach(function( augment ){
      if( typeof augment == "function" ){
        extend(proto, augment.prototype)
      }
      else {
        extend(proto, augment)
      }
    })
  }
  forIn(members, function( member, name ){
    if( member != null ){
      if( typeof member === "object" && (member.constructor === Object || member.toString() === "[object Object]") ){
        proto[name] = member
      }
      else{
        proto[name] = {
          value: member
        }
      }
    }
  })

  return proto
}
