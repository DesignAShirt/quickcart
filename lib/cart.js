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
    define(['eventemitter2'], function (EventEmitter2) {
      return factory(EventEmitter2);
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

    var _id, _product, _price, _signature, _properties, _quantity, _shippable, _countable, _taxable, _group;
    _id           = 'id' in data ? data.id : ++_uid;
    _product      = 'product' in data ? data.product : _id;
    _price        = 'price' in data ? data.price : Number.MAX_VALUE;
    _quantity     = 'quantity' in data ? data.quantity : 1; // FIXME: default should be zero
    _signature    = 'signature' in data ? data.signature : UNSIGNED_PRODUCT;
    _properties   = 'properties' in data ? data.properties : {};
    _group        = 'group' in data ? data.group : null;

    _shippable    = 'shippable' in data ? !!data.shippable : true;
    _countable    = 'countable' in data ? !!data.countable : true;
    _taxable      = 'taxable' in data ? !!data.taxable : true;

    if (typeof _product === 'function' && !_product.name) {
      throw new Error('Price is function but handler is missing name.  e.g. function priceHandlerName() { }');
    }

    Object.defineProperties(this, {
      id: {
        get: function() {
          return _id;
        }
      },

      shippable: {
        get: function() {
          return _shippable;
        }
      },

      countable: {
        get: function() {
          return _countable;
        }
      },

      taxable: {
        get: function() {
          return _taxable;
        }
      },

      group: {
        get: function() {
          return _group;
        }
      },

      product: {
        get: function() {
          return _product;
        }
      },

      price: {
        get: function() {
          // FIXME: prevent calls to cart.total/etc from within price handler?  possible? will inf. loop
          return typeof _price === 'function' ? _price(this) : _price;
        },
        set: function(value) {
          if (this.locked) {
            throw new Error('Cannot set price because cart is locked');
          }
          if (_signature !== UNSIGNED_PRODUCT) {
            throw new Error('Cannot modify price of signed product');
          }
          _price = value;
          this.trigger('price', value);
          this.trigger('total');
          this.trigger('change');
        }
      },

      priceHandler: {
        get: function() {
          return typeof _price === 'function' ? _price : null;
        }
      },

      signature: {
        get: function() {
          return _signature;
        }
      },

      quantity: {
        get: function() {
          return this.countable ? _quantity : 0;
        },
        set: function(value) {
          if (this.locked) {
            throw new Error('Cannot set quantity because cart is locked');
          }
          if (this.countable) {
            _quantity = value;
            this.trigger('quantity');
            this.trigger('total');
            this.trigger('change');
          }
          else {
            this.trigger('error', new Error('Cannot set quantity because this item is not countable'));
          }
        }
      },

      properties: {
        get: function() {
          var obj = {};
          for (var k in _properties) {
            obj[k] = _properties[k];
          }
          Object.freeze(obj);
          return obj;
        }
      },

      property: {
        value: function(key, value) {
          switch (arguments.length) {
            case 1:
              return _properties[key];
            case 2:
              if (this.locked) {
                throw new Error('Cannot set property because cart is locked');
              }
              var prev = _properties[key];
              _properties[key] = value;
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
          // if is not countable, the price is returned directly
          if (this.countable) {
            return this.price * this.quantity;
          }
          else {
            return this.price;
          }
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
      , price: typeof this.priceHandler === 'function' ? this.priceHandler.name : this.price
      , group: this.group
      , taxable: this.taxable
      , countable: this.countable
      , shippable: this.shippable
      , quantity: this.quantity
      , signature: this.signature
      , subtotal: this.subtotal
      , properties: this.properties
    };
  };

  Item.effectsCount = function(item) {
    return !('countable' in item) || item.countable;
  };

  Item.effectsQuantity = function(item) {
    return item.quantity > 0 && Item.effectsCount(item);
  };

  Item.effectsTotal = function(item) {
    return Item.effectsQuantity(item) && (typeof item.price === 'function' || item.price > 0);
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

      // if a quantity is set to zero, the item is removed
      removeOnZeroQuantity: true,

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
        return this.tallyBy('subtotal');
      }
    });

    Object.defineProperty(this, 'taxableTotal', {
      get: function() {
        return this.tallyBy('subtotal', 'taxable');
      }
    });

    Object.defineProperty(this, 'count', {
      get: function() {
        return this.itemsBy('countable').length;
      }
    });

    Object.defineProperty(this, 'quantity', {
      get: function() {
        return this.tallyBy('quantity', 'countable');
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
      .on('quantity', function() {
        _this.trigger('item:quantity', this);
        _this.trigger('quantity');
        if (_this.removeOnZeroQuantity && 0 === this.quantity) {
          _this.remove(this);
        }
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
      , countChanged = false
      , qtyChanged = false
      , totalChanged = false
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
          countChanged  = countChanged  || Item.effectsCount(item);
          qtyChanged    = qtyChanged    || Item.effectsQuantity(item);
          totalChanged  = totalChanged  || Item.effectsTotal(item);
        }
        else {
          this.trigger('error', new Error('Attempting to add an item that already exists in cart'), item);
        }
      }
      countChanged  && this.trigger('count');
      qtyChanged    && this.trigger('quantity');
      totalChanged  && this.trigger('total');
    }
    return this;
  };

  Cart.prototype.remove = function() {
    if (this.locked) {
      throw new Error('Cannot remove because cart is locked');
    }
    var removals = toArray(arguments, true)
      , removal
      , countChanged = false
      , qtyChanged = false
      , totalChanged = false
      , item;
    if (removals.length) {
      for (var i=0; i < removals.length; i++) {
        removal = removals[i];
        item = removal instanceof Item ? removal : this.find(removal);
        if (item) {
          this._items.splice(this._items.indexOf(item), 1);
          this.trigger('item:remove', item);
          this.trigger('change');
          countChanged  = countChanged  || Item.effectsCount(item);
          qtyChanged    = qtyChanged    || Item.effectsQuantity(item);
          totalChanged  = totalChanged  || Item.effectsTotal(item);
        }
        // else {
        //   this.trigger('error', new Error('Item "' + removal + '" was not found in cart'));
        // }
      }
      countChanged  && this.trigger('count');
      qtyChanged    && this.trigger('quantity');
      totalChanged  && this.trigger('total');
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

  Cart.prototype.itemsBy = function(property, value) {
    var compareValue = void 0 !== value;
    return void 0 === property && !compareValue ? this._items : this._items.filter(function(element) {
      var v = element[property];
      return compareValue ? v === value : !!v;
    });
  };

  Cart.prototype.tallyBy = function(aggregate, property, value) {
    var total = 0
      , filtered = this.itemsBy(property, value);
    if (filtered.length) {
      total = filtered.reduce(function(prev, cur) {
        return prev + cur[aggregate];
      }, 0);
    }
    return total;
  };

  Cart.prototype.clear = function() {
    Cart.prototype.remove.apply(this, this._items);
    this.trigger('clear');
    return this;
  };

  Cart.prototype.meta = function(key, value) {
    switch (arguments.length) {
      case 1:
        return this.options.meta[key];
      case 2:
        var prev = this.options.meta[key];
        this.options.meta[key] = value;
        this.trigger('meta:change', key, value, prev);
        this.trigger('change');
        return this.options.meta[key];
      default:
        throw new Error('Invalid argument length');
    }
  };

  Cart.prototype.toJSON = function() {
    return {
        store: this.options.store
      , user: this.options.user
      , meta: this.options.meta
      , total: this.total
      , taxableTotal: this.taxableTotal
      , count: this.count
      , quantity: this.quantity
      , signature: this.signature
      , items: this._items.map(Function.prototype.call, Item.prototype.toJSON)
    };
  };

  Cart.from = function(json, signer) {
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
    return new Cart(json.items, options);
  };

  Cart.Item = Item;

  Cart.utils = {
    toArray: toArray,
  };

  return Cart;
}));
