(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.fidget = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var register = require("./../lib/register")
var delegate = require("./../lib/delegate")
var fragment = require("./../lib/fragment")
var components = require("./../lib/components")

var fidget = {}
fidget.register = register
fidget.delegate = delegate
fidget.fragment = fragment
fidget.components = components

module.exports = fidget

},{"./lib/components":2,"./lib/delegate":9,"./lib/fragment":10,"./lib/register":11}],2:[function(require,module,exports){
var components = module.exports = {}

function get( fn ){
  return {
    get: fn
  }
}

function process( processor, result ){
  switch( true ){
    case typeof processor == "function":
      return processor(result)
    case processor == "array":
      return [].slice.call(result)
    default:
      return result
  }
}

components.byClassName = function( className, processor ){
  return get(function(  ){
    return process(processor, this.getElementsByClassName(className))
  })
}

components.byTagName = function( tagName, processor ){
  return get(function(  ){
    return process(processor, this.getElementsByTagName(tagName))
  })
}

components.byId = function( id, processor ){
  return get(function(  ){
    return process(processor, this.getElementById(id))
  })
}

components.selector = function( selector, processor ){
  return get(function(  ){
    return process(processor, this.querySelector(selector))
  })
}

components.selectorALl = function( selector, processor ){
  return get(function(  ){
    return process(processor, this.querySelectorAll(selector))
  })
}

components.attribute = function( attribute, processor ){
  return get(function(  ){
    return process(processor, this.querySelector('['+attribute+']'))
  })
}

components.attributeAll = function( attribute, processor ){
  return get(function(  ){
    return process(processor, this.querySelectorAll('['+attribute+']'))
  })
}

},{}],3:[function(require,module,exports){
var defineAttribute = require("./defineAttribute")

/**
 * Defines attributes on a prototype
 * Registers onChangeCallbacks on a hash
 * Registers default values on a hash
 * */
module.exports = function createAttributes( proto, attributes ){
  var def
  var attrManager = new AttributeManager()
  for( var name in attributes ){
    if( attributes.hasOwnProperty(name) ){
      def = attributes[name]
      proto[name] = defineAttribute(name, def, attrManager)
    }
  }

  return attrManager
}

function AttributeManager(  ){
  this.defaultValues = {}
  this.onChangedCallbacks = {}
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
      if( defaultValue === "attribute" ){
        if( attrName in element ){
          defaultValue = element[attrName]
        }
        else {
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

},{"./defineAttribute":7}],4:[function(require,module,exports){
module.exports = function createDispatcher( events, tagName ){
  if( !events ) return function(  ){
    return this
  }

  return function dispatch( name, detail ){
    var dispatcher = events[name]
    if( typeof dispatcher == "undefined" ){
      console.error("'%s' is not a dispatcher on '%s'", name, tagName)
      return
    }
    if( typeof dispatcher !== "function" ){
      return this.dispatchEvent(new window.CustomEvent(name, {
        detail: detail||{},
        'view': dispatcher.view || window,
        'bubbles': dispatcher.bubbles != undefined ? dispatcher.bubbles : true,
        'cancelable': dispatcher.cancelable != undefined ? dispatcher.cancelable : true
      }))
    }
    return dispatcher.call(this, detail)
  }
}
},{}],5:[function(require,module,exports){
var fragment = require("./fragment")

module.exports = function createFragments( fragments, renderFragment, compilerOptions ){
  for( var name in fragments ){
    if( fragments.hasOwnProperty(name) ){
      fragments[name] = fragment(fragments[name], renderFragment, compilerOptions)
    }
  }

  return function renderFragment( name, templateData ){
    var template = fragments[name]
    if( !template ) {
      console.warn("Unknown fragment", name)
      return null
    }
    try{
      return template(templateData)
    }
    catch( e ){
      console.error("Error rendering fragment '%s'", name)
      throw e
    }
  }
}
},{"./fragment":10}],6:[function(require,module,exports){
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

},{"../util/extend":13,"../util/forIn":14}],7:[function(require,module,exports){
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

  if( attributeManager ){
    if( typeof def["onchange"] == "function" ){
      attributeManager.addOnChangedCallback(name, def["onchange"])
    }
    if( typeof defaultValue != "undefined" && defaultValue != null ){
      attributeManager.addDefaultValue(name, defaultValue)
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

},{}],8:[function(require,module,exports){
/**
 * Attach a getter to the proto object
 * that proxies a querySelector call.
 *
 * @example
 *
 * components: {
 *  descriptionElement: ".description"
 * }
 *
 * // later..
 *
 * var customElement = document.createElement("some-thing")
 * customElement.descriptionElement.textContent = "hello"
 *
 * */
module.exports = function defineComponents( proto, elements ){
  var def
  for( var name in elements ){
    if( elements.hasOwnProperty(name) ){
      def = defineComponent(elements[name])
      if( def ){
        proto[name] = def
      }
    }
  }
}

function defineComponent( def ){
  if( !def ) return

  switch( typeof def ){
    case "function":
      return {
        get: def
      }
    case "string":
      return {
        get: function(){
          return this.querySelector(def)
        }
      }
    default:
      if( typeof def.get == "function" && typeof def.set == "function" ){
        return {
          get: def.get,
          set: def.set
        }
      }
      if( typeof def.get == "function" ){
        return {
          get: def.get
        }
      }
      if( typeof def.set == "function" ){
        return {
          set: def.set
        }
      }
  }
}
},{}],9:[function(require,module,exports){
/**
 * Registers an event listener on an element
 * and returns a delegator.
 * A delegated event runs matches to find an event target,
 * then executes the handler paired with the matcher.
 * Matchers can check if an event target matches a given selector,
 * or see if an of its parents do.
 * */
module.exports = function delegate( options ){
  var element = options.element
    , event = options.event
    , capture = !!options.capture||false
    , context = options.context||element

  if( !element ){
    console.log("Can't delegate undefined element")
    return null
  }
  if( !event ){
    console.log("Can't delegate undefined event")
    return null
  }

  var delegator = createDelegator(context)
  element.addEventListener(event, delegator, capture)

  return delegator
}

/**
 * Returns a delegator that can be used as an event listener.
 * The delegator has static methods which can be used to register handlers.
 * */
function createDelegator( context ){
  var matchers = []

  function delegator( e ){
    var l = matchers.length
    if( !l ){
      return true
    }

    var el = this
      , i = -1
      , handler
      , selector
      , delegateElement
      , stopPropagation
      , args

    while( ++i < l ){
      args = matchers[i]
      handler = args[0]
      selector = args[1]

      delegateElement = matchCapturePath(selector, el, e)
      if( delegateElement && delegateElement.length ) {
        stopPropagation = false === handler.apply(context, [e].concat(delegateElement))
        if( stopPropagation ) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Registers a handler with a target finder logic
   * */
  delegator.match = function( selector, handler ){
    matchers.push([handler, selector])
    return delegator
  }

  return delegator
}

function matchCapturePath( selector, el, e ){
  var delegateElements = []
  var delegateElement = null
  if( Array.isArray(selector) ){
    var i = -1
    var l = selector.length
    while( ++i < l ){
      delegateElement = findParent(selector[i], el, e)
      if( !delegateElement ) return null
      delegateElements.push(delegateElement)
    }
  }
  else {
    delegateElement = findParent(selector, el, e)
    if( !delegateElement ) return null
    delegateElements.push(delegateElement)
  }
  return delegateElements
}

/**
 * Check if the target or any of its parent matches a selector
 * */
function findParent( selector, el, e ){
  var target = e.target
  switch( typeof selector ){
    case "string":
      while( target && target != el ){
        if( target.matches(selector) ) return target
        target = target.parentNode
      }
      break
    case "function":
      while( target && target != el ){
        if( selector.call(el, target) ) return target
        target = target.parentNode
      }
      break
    default:
      return null
  }
  return null
}
},{}],10:[function(require,module,exports){
var merge = require("../util/merge")
var template = require("lodash.template")

module.exports = fragment

fragment.options = {
  variable: "f"
}

function fragment( html, compiler, compilerOptions ){
  compiler = compiler || template
  compilerOptions = merge(fragment.options, compilerOptions)
  var render = null
  return function( templateData ){
    var temp = window.document.createElement("div")
    if( typeof compiler == "function" && !render ){
      render = compiler(html, compilerOptions)
    }
    if( render ){
      try{
        html = render(templateData)
      }
      catch( e ){
        console.error("Error rendering fragment with context:", templateData)
        console.error(render.toString())
        console.error(e)
        throw e
      }
    }

    temp.innerHTML = html
    var fragment = window.document.createDocumentFragment()
    while( temp.childNodes.length ){
      fragment.appendChild(temp.firstChild)
    }
    return fragment
  }
}
fragment.render = function( html, templateData ){
  return fragment(html)(templateData)
}

},{"../util/merge":15,"lodash.template":12}],11:[function(require,module,exports){
var createPrototype = require("./createPrototype")
var createAttributes = require("./createAttributes")
var createDispatcher = require("./createDispatcher")
var createFragments = require("./createFragments")
var defineComponents = require("./defineComponents")
var extend = require("../util/extend")
var merge = require("../util/merge")

/** Widget registry, contains native element constructors by their tag-name */
var widgets = {}
/** A registry for definitions provided to the register function */
var definitions = {}

/** Register a custom element */
module.exports = function register( definition ){
  if( !definition ){
    console.error("Missing element definition")
    return
  }

  /** the name of the custom element */
  var name = definition["name"]

  if( !/\w\-\w/gi.test(name) || /\s/gi.test(name) ){
    console.error("Invalid element name", name)
    return null
  }

  definitions[name] = extend({}, definition)
  var parentDefinition = {}

  /** The super class the element inherits its prototype from */
  var inherit = definition["inherit"]
  switch( typeof inherit ){
    case "string":
      // inherit an existing custom element
      if( widgets[inherit] ){
        parentDefinition = definitions[inherit]
        inherit = widgets[inherit].prototype
      }
      else{
        console.warn("Can't inherit undefined widget: ", inherit)
        inherit = null
      }
      break
    case "function":
      // inherit a constructor prototype
      inherit = inherit.prototype
      break
  }
  // by default inherit from HTMLElement
  if( !inherit ) {
    inherit = window.HTMLElement.prototype
  }

  /** The element this custom element extends */
  var is = definition["extends"] ? definition["extends"] : undefined

  /** Mixin prototypes */
  var augments = definition["augments"]

  /** Static properties */
  var statics = definition["static"]
  if( parentDefinition && parentDefinition["static"] ){
    statics = merge(parentDefinition["static"], statics)
  }

  /** An optional function to render this custom element */
  var renderFn = definition["render"]

  /** Attribute shortcuts */
  var attributes = definition["attributes"]

  /** Html fragments */
  var fragments = definition["fragments"]
  if( parentDefinition && parentDefinition.fragments ){
    fragments = merge(parentDefinition.fragments, fragments)
  }
  /** A function to render html fragment strings */
  var renderFragment = definition["renderFragment"]
  /** Options passed to createFragments() */
  var compilerOptions = definition["compilerOptions"]

  /** Event definitions for dispatch */
  var events = definition["events"]
  if( parentDefinition && parentDefinition.events ){
    events = merge(parentDefinition.events, events)
  }

  /** Element getter shortcuts */
  var elements = definition["components"]

  // extracting reserved words
  delete definition["name"]
  delete definition["inherit"]
  delete definition["extends"]
  delete definition["static"]
  delete definition["augments"]
  delete definition["attributes"]
  delete definition["fragments"]
  delete definition["renderFragment"]
  delete definition["compilerOptions"]
  delete definition["events"]
  delete definition["components"]

  // what's left is the prototype
  var proto = definition

  var attributeManager = createAttributes(proto, attributes)
  defineComponents(proto, elements)
  proto.dispatch = createDispatcher(events, name)
  proto.fragment = createFragments(fragments, renderFragment, compilerOptions)
  proto.createdCallback = created(definition["createdCallback"], inherit, attributeManager)
  proto.attributeChangedCallback = attributeChanged(definition["attributeChangedCallback"], inherit, attributeManager)
  proto.attachedCallback = attached(definition["attachedCallback"], inherit)
  proto.detachedCallback = detached(definition["detachedCallback"], inherit)

  proto = createPrototype(proto, augments)
  try{
    proto = Object.create(inherit, proto)
  }
  catch( e ){
    console.error("Couldn't create prototype")
    console.error(e)
  }

  // create the native element constructor
  var Constructor = window.document.registerElement(name, is
    ? {'extends': is, prototype: proto}
    // it's important that `extends` is not in the element definition even if it's undefined
    : {prototype: proto})
  // apply static properties
  extend(Constructor, statics)
  // static render function that instantiates an element
  // and calls render with the arguments passed in
  Constructor.render = staticRender(name, renderFn)
  Constructor.definition = parentDefinition
  Constructor.parent = inherit
  // save it in a registry
  widgets[name] = Constructor

  return Constructor
}

/**
 * Render an element from the widget registry
 * */
module.exports.render = function( name ){
  if( !widgets[name] ){
    console.error("Unregistered element:", name)
    return null
  }
  return widgets[name].render.apply(null, [].slice.call(arguments, 1))
}

function created( createdCallback, inherit, attributeManager ){
  return function(){
    // call super
    if( typeof inherit.createdCallback == "function" ){
      inherit.createdCallback.call(this)
    }
    // reset attribute values according to attribute definitions
    attributeManager.setDefaultValues(this)
    // call the createdCallback for this element if it's defined
    if( typeof createdCallback == "function" ){
      createdCallback.call(this)
    }
  }
}

function attributeChanged( attributeChangedCallback, inherit, attributeManager ){
  return function( name, previousValue, value ){
    // call super
    if( inherit.attributeChangedCallback ){
      inherit.attributeChangedCallback.apply(this, arguments)
    }
    // call the handlers from the attribute definitions first
    attributeManager.callOnChangedCallback(this, name, previousValue, value)
    // then let the general default handler run if it's defined
    if( typeof attributeChangedCallback == "function" ){
      attributeChangedCallback.apply(this, arguments)
    }
  }
}

function attached( attachedCallback, inherit ){
  return function(){
    // call super
    if( inherit.attachedCallback ){
      inherit.attachedCallback.call(this)
    }
    // call the attachedCallback for this element if it's defined
    if( typeof attachedCallback == "function" ){
      attachedCallback.call(this)
    }
  }
}

function detached( detachedCallback, inherit ){
  return function(){
    // call super
    if( inherit.detachedCallback ){
      inherit.detachedCallback.call(this)
    }
    // call the detachedCallback for this element if it's defined
    if( typeof detachedCallback == "function" ){
      detachedCallback.call(this)
    }
  }
}

function staticRender( name, renderFn ){
  return function(){
    var element = window.document.createElement(name)
    if( renderFn ){
      renderFn.apply(element, arguments)
    }
    return element
  }
}

},{"../util/extend":13,"../util/merge":15,"./createAttributes":3,"./createDispatcher":4,"./createFragments":5,"./createPrototype":6,"./defineComponents":8}],12:[function(require,module,exports){

},{}],13:[function(require,module,exports){
module.exports = function extend( obj, extension ){
  for( var name in extension ){
    if( extension.hasOwnProperty(name) ) obj[name] = extension[name]
  }
  return obj
}
},{}],14:[function(require,module,exports){
module.exports = function forIn( obj, fn ){
  for( var name in obj ){
    if( obj.hasOwnProperty(name) ) fn(obj[name], name, obj)
  }
  return obj
}
},{}],15:[function(require,module,exports){
module.exports = function( obj, extension ){
  var merged = {}
  var prop
  for( prop in obj ){
    if( obj.hasOwnProperty(prop) ) {
      merged[prop] = obj[prop]
    }
  }
  for( prop in extension ){
    if( extension.hasOwnProperty(prop) ) {
      merged[prop] = extension[prop]
    }
  }
  return merged
}
},{}]},{},[1])(1)
});
