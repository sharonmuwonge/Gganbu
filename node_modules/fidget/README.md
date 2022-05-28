fidget
======

**WIP NOTICE: this project is in active development**

Fidget is a custom-elements library that helps you define custom dom elements with some added extras.

```js
var CustomElement = fidget.register({
  name: "custom-element",
  attributes: {},
  fragments: {},
  events: {},
  components: {},
  createdCallback: function(  ){}
})

var customElement = new CustomElement()
document.body.appendChild(customElement)
```

### attributes

Define simple attributes and access them on the element instance with a property.

### fragments

Fragments are simple templates you can render with custom data.
A fragment always returns a `HTMLDocumentFragment` object you can append into the DOM.
Templates are using [lodash.template](https://lodash.com/docs#template) to compile render functions by default.

### events

Define custom events and control all the default values of the event object.
Later you can simply dispatch them by name.

### custom components

Custom components are simple shortcuts to the inner elements of the host element.
By default they are `querySelector` calls, but you can overwrite their behaviour any time.

### event delegation

Fidget comes with a powerful event delegation solution.
You can delegate single or multiple elements,
define multiple delegate functions that acts much like middleware,
and stop delegation and time.

## Custom elements support

If you need a polyfill for custom elements,
I recommend [document-register-element](https://github.com/WebReflection/document-register-element).
That's all you need to get going with custom elements and fidget and be crossbrowser.

## LICENCE

MIT; run with it!
