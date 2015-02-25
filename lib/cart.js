// Uses AMD or browser globals to create a module.

// Grabbed from https://github.com/umdjs/umd/blob/master/amdWeb.js.
// Check out https://github.com/umdjs/umd for more patterns.

// Defines a module "cart".
// Note that the name of the module is implied by the file name. It is best
// if the file name and the exported global have matching names.

// If you do not want to support the browser global path, then you
// can remove the `root` use and the passing `this` as the first arg to
// the top function.

(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else {
    // Browser globals
    root.cart = factory();
  }
}(this, function () {
  'use strict';

  var MAX_EVENT_LISTENERS = 10;
  var EventEmitter = {
    listeners: function listeners(evtName) {
      this._handlers = this._handlers || {};
      this._handlers[evtName] = this._handlers[evtName] || [];
      return this._handlers[evtName];
    },
    on: function on(evtName, handler) {
      var handlers = this.listeners(evtName);
      if (handlers.length >= MAX_EVENT_LISTENERS) {
        throw new Error('Maximum event listeners reached');
      }
      else {
        handlers.push(handler);
      }
      return this;
    },
    once: function once(evtName, handler) {
      var _this = this
        , once = function() {
            var ret = handler.apply(this, arguments);
            _this.removeListener(evtName, once);
            return ret;
          };
      return this.on(evtName, once);
    },
    removeListener: function removeListener(evtName, handler) {
      var handlers = this.listeners(evtName)
        , index;
      if (handlers.length) {
        index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
      return this;
    },
    removeListeners: function removeListeners(evtName) {
      this.listeners(evtName).length = 0;
      return this;
    },
    emit: function emit() {
      var args = Cart.utils.toArray(arguments)
        , evtName = args.shift()
        , handlers = this.listeners(evtName);
      for (var i=0; i < handlers.length; i++) {
        handlers[i].apply(this, args);
      }
      return this;
    }
  };

  function Cart(items, options) {
    if (void 0 === options) {
      options = items;
      items = null;
    }

    this.options = {

    };
    Cart.utils.applyProperties(this.options, options, new Error('Invalid Cart property: ' + k));

    this.items = !Array.isArray(items) ? [] : items.map(function(element) {
      return element instanceof Item ? element : new Item(element);
    });
  }

  Cart.prototype.add = function() {
    var additions = Cart.utils.toArray(arguments)
      , addition
      , item;
    for (var i=0; i < additions.length; i++) {
      addition = additions[i];
      item = addition instanceof Item ? addition : new Item(addition);
      if (this.items.indexOf(item) < 0) {
        this.items.push(item);
        this.emit('add', item);
      }
      else {
        this.emit('error', new Error('Attempting to add an item that already exists in cart'), item);
      }
    }
    return this;
  };

  Cart.prototype.remove = function() {
    var removals = Cart.utils.toArray(arguments)
      , removal
      , item;
    for (var i=0; i < removals.length; i++) {
      removal = removals[i];
      item = removal instanceof Item ? removal : this.find(removal);
      if (item) {
        this.items.splice(this.items.indexOf(item), 1);
        this.emit('remove', item);
      }
      else {
        this.emit('error', new Error('Item "' + removal + '" was not found in cart'));
      }
    }
    return this;
  };

  Cart.prototype.find = function(id) {
    for (var i=0; i < this.items.length; i++) {
      if (this.items[i].id === id) {
        return this.items[i];
      }
    }
    return null;
  };

  Cart.prototype.clear = function() {
    this.emit('clearing');
    this.remove(this.items);
    this.emit('clear');
    return this;
  };

  Cart.utils.mixin(EventEmitter, Cart.prototype);

  function Item(properties) {
    this.id           = null;
    this.name         = null;
    this.url          = null;
    this.price        = null;
    this.description  = null;
    this.image        = null;
    this.quantity     = null;
    this.weight       = null;
    this.maxQuantity  = null;
    this.stackable    = null;
    this.shippable    = null;
    this.taxable      = null;
    Cart.utils.applyProperties(this, properties, new Error('Invalid Cart property: ' + k));
  }

  Cart.utils.mixin(EventEmitter, Item.prototype);

  Cart.from = function(json) {
    return new Cart(json.items, json.options);
  };

  Cart.Item = Item;

  Cart.utils = {
    mixin: function(src, targ) {
      for (var k in src) {
        if (!(k in targ)) {
          targ[k] = function() {
            return src[k].apply(this.items, arguments);
          };
        }
      }
    },
    toArray: function(arr) {
      if (Array.isArray(arr)) {
        return arr;
      }
      else if (typeof arr === 'object' && !!arr && 'length' in arr) { // duck. object, not null, has length property
        return Array.prototype.slice.call(arr);
      }
      else {
        return [arr];
      }
    },
    applyProperties: function applyProperties(target, obj, err) {
      obj = obj || {};
      for (var k in obj) {
        if (!(k in target)) {
          throw err;
        }
        target[k] = obj[l]
      }
    }
  };

  return Cart;
}));
