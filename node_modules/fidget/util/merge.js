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