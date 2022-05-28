var components = module.exports = {}

function get( fn ){
  return {
    get: fn
  }
}

function process( element, processor, result ){
  switch( true ){
    case typeof processor == "function":
      return processor.call(element, result)
    case processor == "array":
      return [].slice.call(result)
    default:
      return result
  }
}

components.byClassName = function( className, processor ){
  return get(function(  ){
    return process(this, processor, this.getElementsByClassName(className))
  })
}

components.byTagName = function( tagName, processor ){
  return get(function(  ){
    return process(this, processor, this.getElementsByTagName(tagName))
  })
}

components.byId = function( id, processor ){
  return get(function(  ){
    return process(this, processor, this.getElementById(id))
  })
}

components.selector = function( selector, processor ){
  return get(function(  ){
    return process(this, processor, this.querySelector(selector))
  })
}

components.selectorALl = function( selector, processor ){
  return get(function(  ){
    return process(this, processor, this.querySelectorAll(selector))
  })
}

components.attribute = function( attribute, processor ){
  return get(function(  ){
    return process(this, processor, this.querySelector('['+attribute+']'))
  })
}

components.attributeAll = function( attribute, processor ){
  return get(function(  ){
    return process(this, processor, this.querySelectorAll('['+attribute+']'))
  })
}
