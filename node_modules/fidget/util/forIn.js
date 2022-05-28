module.exports = function forIn( obj, fn ){
  for( var name in obj ){
    if( obj.hasOwnProperty(name) ) fn(obj[name], name, obj)
  }
  return obj
}