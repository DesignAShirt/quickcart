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
    define([], function() {
      throw new Error('FIXME: inject the correct EventEmitter');
      return factory();
    });
  }
  else if (typeof module !== 'undefined' && module.exports && require) {
    module.exports = factory(require('../bower_components/eventemitter2/index.js').EventEmitter2);
  }
  else {
    root.Cart = factory(root.EventEmitter2);
  }
}(this, function (EventEmitter) {
  'use strict';

  // TODO: handle updating quantity if dupe item type passed.  maybe option to throw/update

  var _uid = 0
    , UNSIGNED_PRODUCT = null;

  function toArray(arr, singleArgArray) {
    if (singleArgArray && 1 === arr.length && Array.isArray(arr[0])) { // single item arguments that is array
      return arr[0].slice();
    }
    else if (Array.isArray(arr)) {
      return arr.slice();
    }
    else if (typeof arr === 'object' && !!arr && 'length' in arr) { // duck. object, not null, has length property
      return Array.prototype.slice.call(arr);
    }
    else {
      return [arr];
    }
  }

  // http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  function hashCode(s) {
    var hash = 0
      , strlen = s.length
      , i, c;
    if (0 === strlen) {
      return hash;
    }
    for (i = 0; i < strlen; i++) {
      c = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + c;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  function Item(data) {
    data = data || {};

    var id, product, price, signature, properties, quantity;
    id          = 'id' in data ? data.id : ++_uid;
    product     = 'product' in data ? data.product : id;
    price       = 'price' in data ? data.price : Number.MAX_VALUE;
    quantity    = 'quantity' in data ? data.quantity : 1;
    signature   = 'signature' in data ? data.signature : UNSIGNED_PRODUCT;
    properties  = 'properties' in data ? data.properties : {};

    Object.defineProperties(this, {
      id: {
        get: function() {
          return id;
        }
      },

      product: {
        get: function() {
          return product;
        }
      },

      price: {
        get: function() {
          return price;
        },
        set: function(value) {
          if (this.locked) {
            throw new Error('Cannot set price because cart is locked');
          }
          if (signature !== UNSIGNED_PRODUCT) {
            throw new Error('Cannot modify price of signed product');
          }
          price = value;
          this.trigger('price', value);
          this.trigger('total');
          this.trigger('change');
        }
      },

      signature: {
        get: function() {
          return signature;
        }
      },

      quantity: {
        get: function() {
          return quantity;
        },
        set: function(value) {
          if (this.locked) {
            throw new Error('Cannot set quantity because cart is locked');
          }
          quantity = value;
          this.trigger('quantity', value);
          this.trigger('total');
          this.trigger('change');
        }
      },

      properties: {
        get: function() {
          return Object.create(properties);
        }
      },

      property: {
        value: function(key, value) {
          switch (arguments.length) {
            case 1:
              return properties[key];
            case 2:
              if (this.locked) {
                throw new Error('Cannot set property because cart is locked');
              }
              var prev = properties[key];
              properties[key] = value;
              this.trigger('property:change', key, value, prev);
              this.trigger('change');
              return this;
            default:
              throw new Error('Invalid argument length');
          }
        }
      },

      subtotal: {
        get: function() {
          return this.price * this.quantity;
        }
      },
    });

    var _locked = false;
    Object.defineProperty(this, 'locked', {
      get: function() {
        return _locked;
      }
    });
    Object.defineProperty(this, 'lock', {
      value: function(isLocked) {
        if (typeof isLocked === 'boolean') {
          if (_locked !== isLocked) {
            _locked = isLocked;
            this.trigger(_locked ? 'lock' : 'unlock');
          }
        }
        else {
          throw new Error('Invalid lock value');
        }
      }
    });
  }

  Item.prototype = Object.create(EventEmitter.prototype);
  Item.prototype.constructor = Item;

  // delay event emits
  Item.prototype.trigger = function() {
    var _this = this
      , args = arguments;
    setTimeout(function() {
      _this.emit.apply(_this, args);
    }, 0);
  };

  Item.prototype.toJSON = function() {
    return {
        product: this.product
      , price: this.price
      , quantity: this.quantity
      , signature: this.signature
      , subtotal: this.subtotal
      , properties: this.properties
    };
  };

  function Cart(items, options) {
    var _this = this;
    if (!Array.isArray(items)) {
      options = items;
      items = null;
    }

    this.options = {
      // unique ID for the current store
      store: 'store',

      // user ID
      user: 'guest',

      meta: {},

      // if adding a product that already exists, how should it be handled:
      //  - add: dupe item quantity should be added to current item quantity
      //  - error: do noting and emit an error
      //  - allow: allow dupe items to exist
      dupeItemMode: 'error',

      // create a signature for current cart
      signer: function(cart) {
        var itemsAsStr = _this._items.map(function(item) {
          return [ item.product, item.price, item.signature, item.quantity ].join(':');
        }).join('|');
        return hashCode([ _this.store, _this.user, itemsAsStr ].join(';'));
      },

      // payment processor strategy
      paymentDriver: function(cart, callback) {
        callback(new Error('No payment processor strategy provided'));
      }
    };

    options = options || {};
    for (var k in options) {
      if (k in this.options) {
        this.options[k] = options[k];
      }
      else {
        throw new Error('Invalid Cart option: ' + k);
      }
    }
    Object.freeze(this.options);

    this._items = !Array.isArray(items) ? [] : items.map(function(element) {
      return element instanceof Item ? element : new Item(element);
    });

    Object.defineProperty(this, 'total', {
      get: function() {
        return !this._items.length ? 0 : this._items.reduce(function(prev, cur) {
          return prev + cur.subtotal;
        }, 0);
      }
    });

    Object.defineProperty(this, 'count', {
      get: function() {
        return this._items.length;
      }
    });

    Object.defineProperty(this, 'signature', {
      get: function() {
        try {
          return this.options.signer(this);
        }
        catch (err) {
          this.trigger('error', new Error('Cart signer threw an error'));
          throw err;
        }
      }
    });

    var _locked = false;
    Object.defineProperty(this, 'locked', {
      get: function() {
        return _locked;
      }
    });
    Object.defineProperty(this, 'lock', {
      value: function(isLocked) {
        if (typeof isLocked === 'boolean') {
          if (_locked !== isLocked) {
            _locked = isLocked;
            this._items.forEach(function(item) {
              item.lock(_locked);
            });
            this.trigger(_locked ? 'lock' : 'unlock');
          }
        }
        else {
          throw new Error('Invalid lock value');
        }
      }
    });
  }

  Cart.prototype = Object.create(EventEmitter.prototype);
  Cart.prototype.constructor = Cart;

  // delay event emits
  Cart.prototype.trigger = function() {
    var _this = this
      , args = arguments;
    setTimeout(function() {
      _this.emit.apply(_this, args);
    }, 0);
  };

  Cart.prototype.itemAt = function(index) {
    return this._items[index];
  };

  Cart.prototype._watchItem = function(item) {
    var _this = this;
    item
      .on('error', function(err) {
        _this.trigger('item:error', err, this);
        _this.trigger('error', err);
      })
      .on('change', function() {
        _this.trigger('item:change', this);
        _this.trigger('change');
      })
      .on('total', function() {
        _this.trigger('item:total', this);
        _this.trigger('total');
      });
    return this;
  };

  Cart.prototype.add = function() {
    if (this.locked) {
      throw new Error('Cannot add because cart is locked');
    }
    var additions = toArray(arguments, true)
      , addition
      , item;
    if (additions.length) {
      for (var i=0; i < additions.length; i++) {
        addition = additions[i];
        item = addition instanceof Item ? addition : new Item(addition);
        if (this._items.indexOf(item) < 0) {
          var dupe = this.findBy('product', item.product);
          if (dupe) {
            switch (this.options.dupeItemMode) {
              default:
              case 'error':
                this.trigger('error', new Error('Duplicate product exists and dupeItemMode is set to error'), item, dupe);
                continue;
              case 'add':
                dupe.quantity += item.quantity;
                continue;
              case 'allow':
                // do nothing, let it be added
              break;
            }
          }
          this._items.push(item);
          this._watchItem(item);
          this.trigger('item:add', item);
          this.trigger('change');
        }
        else {
          this.trigger('error', new Error('Attempting to add an item that already exists in cart'), item);
        }
      }
      this.trigger('count');
      this.trigger('total');
    }
    return this;
  };

  Cart.prototype.remove = function() {
    if (this.locked) {
      throw new Error('Cannot remove because cart is locked');
    }
    var removals = toArray(arguments, true)
      , removal
      , item;
    if (removals.length) {
      for (var i=0; i < removals.length; i++) {
        removal = removals[i];
        item = removal instanceof Item ? removal : this.find(removal);
        if (item) {
          this._items.splice(this._items.indexOf(item), 1);
          this.trigger('item:remove', item);
          this.trigger('change');
        }
        else {
          this.trigger('error', new Error('Item "' + removal + '" was not found in cart'));
        }
      }
      this.trigger('count');
      this.trigger('total');
    }
    return this;
  };

  Cart.prototype.removeIndex = function(index) {
    var item = this._items[index];
    if (item) {
      this.remove(item);
    }
    return this;
  };

  Cart.prototype.findBy = function(property, value) {
    for (var i=0; i < this._items.length; i++) {
      if (this._items[i][property] === value) {
        return this._items[i];
      }
    }
    return null;
  };

  Cart.prototype.find = function(id) {
    return this.findBy('id', id);
  };

  Cart.prototype.clear = function() {
    Cart.prototype.remove.apply(this, this._items);
    this.trigger('clear');
    return this;
  };

  Cart.prototype.purchase = function(callback) {
    if (this.locked) {
      throw new Error('Cannot purchase because cart is locked');
    }
    var _this = this
      , wrappedCallback;
    callback = callback || function(){};
    wrappedCallback = function() {
      callback.apply(this, arguments);
      callback = function() {
        _this.trigger('error', new Error('Purchase callback already called'));
      };
    }
    if (this._items.length) {
      this.lock(true);
      this.trigger('purchasing');
      try {
        this.options.paymentDriver(this, function(err, success) {
          _this.lock(false);
          wrappedCallback(err, success);
          if (err) {
            _this.trigger('error', err);
            return;
          }
          _this.trigger('purchase', success);
        });
      }
      catch(err) {
        this.trigger('error', new Error('Payment driver lead to error'));
        this.lock(false);
        wrappedCallback(err);
        throw err;
      }
    }
    else {
      var emptyErr = new Error('Cannot purchase because cart is empty');
      wrappedCallback(emptyErr);
      this.trigger('error', emptyErr);
    }
    return this;
  };

  Cart.prototype.toJSON = function() {
    return {
        store: this.options.store
      , user: this.options.user
      , meta: this.options.meta
      , total: this.total
      , signature: this.signature
      , items: this._items.map(Function.prototype.call, Item.prototype.toJSON)
    };
  };

  Cart.from = function(json, signer, paymentDriver) {
    var options = {
      store: json.store,
      user: json.user,
      meta: json.meta
    };
    if (signer) {
      options.signer = signer;
    }
    else if (json.signer) {
      options.signer = json.signer;
    }
    if (paymentDriver) {
      options.paymentDriver = paymentDriver;
    }
    else if (json.paymentDriver) {
      options.paymentDriver = json.paymentDriver;
    }
    return new Cart(json.items, options);
  };

  Cart.Item = Item;

  Cart.utils = {
    toArray: toArray,
  };

  return Cart;
}));
