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