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
  var customInherit = ""
  switch( typeof inherit ){
    case "string":
      // inherit an existing custom element
      if( widgets[inherit] ){
        customInherit = inherit
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

  var attributeManager = createAttributes(name, customInherit, proto, attributes)
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
