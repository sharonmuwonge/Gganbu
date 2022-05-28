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
        detail: typeof detail != "undefined" ? detail : {},
        'view': dispatcher.view || window,
        'bubbles': dispatcher.bubbles != undefined ? dispatcher.bubbles : true,
        'cancelable': dispatcher.cancelable != undefined ? dispatcher.cancelable : true
      }))
    }
    return dispatcher.call(this, detail)
  }
}