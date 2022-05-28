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