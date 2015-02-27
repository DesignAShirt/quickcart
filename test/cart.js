/**
 * cart
 *
 *    Library test
 */

'use strict'

var assert = require('assert')
  , Cart = require('../lib/cart');

var successfulPaymentDriver = function paymentDriver(cart, callback) {
  setTimeout(function() {
    callback(null, true);
  }, 0);
};

describe('Cart', function() {
  describe('#ctor()', function(){
    it('should instantiate', function() {
      var cart = new Cart();
      assert.strictEqual(true, cart instanceof Cart);
      assert.strictEqual(cart.constructor, Cart);
    });
    it('should handle a variety of arguments', function() {
      assert.doesNotThrow(function() {
        var undf = void 0;
        new Cart(null); new Cart(null, null); new Cart([], null); new Cart(null, {});
        new Cart(undf); new Cart(undf, undf); new Cart([], undf); new Cart(undf, {});
      });
    });
    it('should accept items', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , cart = new Cart([item1, item2]);
      assert.strictEqual(cart._items[0], item1);
      assert.strictEqual(cart._items[1], item2);
    });
    it('should accept options', function() {
      var storeName = 'test'
        , options = { store: storeName, user: 'user', meta: { meta: 1 }, signer: function(){}, paymentDriver: function(){} }
        , cart = new Cart(options);
      assert.strictEqual(cart.options.store, storeName);
    });
    it('should error with invalid options', function() {
      assert.throws(function() {
        new Cart({
          does: 'not exit'
        });
      }, Error);
    });
    it('should accept items and options', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , storeName = 'test'
        , options = { store: storeName }
        , cart = new Cart([item1, item2], options);
      assert.strictEqual(cart._items[0], item1);
      assert.strictEqual(cart._items[1], item2);
      assert.strictEqual(cart.options.store, storeName);
    });
  });

  describe('#options', function(){
    it('should have immutable options', function() {
      var storeName = 'test'
        , options = { store: storeName }
        , cart = new Cart(options);
      assert.throws(function() {
        cart.options.store = 'something else';
      }, Error)
    });
  });

  describe('#meta', function(){
    it('should have mutable options.meta', function() {
      var storeName = 'test'
        , options = { store: storeName }
        , metaValue = 'bar'
        , cart = new Cart(options);
      cart.options.meta.foo = metaValue;
      assert.strictEqual(cart.options.meta.foo, metaValue);
    });
  });

  describe('#count', function(){
    it('should have a read only count accessor', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , cart = new Cart([item1, item2]);
      assert.strictEqual(2, cart.count);
      assert.throws(function() {
        cart.count = 500;
      }, Error);
    });
  });

  describe('#total', function(){
    it('should have a read only total accessor', function() {
      var item1 = new Cart.Item({ price: 100 })
        , item2 = new Cart.Item({ price: 250 })
        , cart = new Cart([item1, item2]);
      assert.strictEqual(350, cart.total);
      assert.throws(function() {
        cart.total = 1;
      }, Error);
    });
  });

  describe('#signature', function(){
    it('should have a signature that returns the result of options.signer', function() {
      var sig = 'the signature'
        , cart = new Cart({ signer: function() { return sig; } });
      assert.strictEqual(sig, cart.signature);
      assert.throws(function() {
        cart.total = 1;
      }, Error);
    });
  });

  describe('#locked', function(){
    it('should have a boolean locked property', function() {
      var cart = new Cart();
      assert.strictEqual(cart.locked, false);
      assert.throws(function() {
        cart.locked = true;
      }, Error);
    });
  });

  describe('#lock()', function(){
    it('should be lockable and unlockable', function() {
      var cart = new Cart();
      cart.lock(true);
      assert.strictEqual(cart.locked, true);
      assert.throws(function() {
        cart.add();
      }, Error);
      cart.lock(false);
      assert.strictEqual(cart.locked, false);
      assert.doesNotThrow(function() {
        cart.add();
      });
    });
  });

  describe('#itemAt()', function(){
    it('should return items by index', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , cart = new Cart([item1, item2]);
      assert.strictEqual(cart.itemAt(0), item1);
      assert.strictEqual(cart.itemAt(1), item2);
    });
  });

  describe('#add()', function(){
    it('should accept adding Item or object literals', function() {
      var item1 = new Cart.Item()
        , item2 = { product: 'item2' }
        , cart = new Cart();
      cart.add(item1);
      assert.strictEqual(cart._items[0], item1);
      cart.add(item2);
      assert.strictEqual(cart._items[0], item1); // check both again
      assert.strictEqual(cart._items[1] instanceof Cart.Item, true);
      assert.strictEqual(cart._items[1].product, 'item2');
    });
    it('should handle incorrect values', function() {
      var cart = new Cart();
      assert.doesNotThrow(function() {
        cart.add();
        cart.add(null);
        cart.add(void 0);
        cart.add([]);
      });
    });
    it('should not allow adding same item twice', function() {
      var cart = new Cart().on('error', function(){})
        , item = new Cart.Item();
      cart.add(item);
      assert.strictEqual(1, cart.count);
      cart.add(cart.itemAt(0));
      assert.strictEqual(1, cart.count);

      cart.clear();
      assert.strictEqual(0, cart.count);
      cart.add(item, item);
      assert.strictEqual(1, cart.count);

      cart.clear();
      assert.strictEqual(0, cart.count);
      cart.add(item);
      cart.add(item);
      assert.strictEqual(1, cart.count);

      cart.clear();
      assert.strictEqual(0, cart.count);
      cart.add([item, item]);
      assert.strictEqual(1, cart.count);
    });
    it('should allow adding items one at a time', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , cart = new Cart();
      cart.add(item1);
      assert.strictEqual(cart._items[0], item1);
      cart.add(item2);
      assert.strictEqual(cart._items[0], item1); // check both again
      assert.strictEqual(cart._items[1], item2);
    });
    it('should allow adding items as parameters', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , cart = new Cart();
      cart.add(item1, item2);
      assert.strictEqual(cart._items[0], item1);
      assert.strictEqual(cart._items[1], item2);
    });
    it('should allow adding items as an array', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , cart = new Cart();
      cart.add([item1, item2]);
      assert.strictEqual(cart._items[0], item1);
      assert.strictEqual(cart._items[1], item2);
    });
    it('should not allow adding if locked', function() {
      var cart = new Cart();
      cart.lock(true);
      assert.throws(function() {
        cart.add();
      }, Error);
    });
    it('should be optional how to handle adding duplicate products');
  });

  describe('#remove()', function(){
    it('should accept removing by ref or Item.id', function() {
      var item1 = new Cart.Item()
        , item2 = { id: 'item2' }
        , cart = new Cart([item1, item2]);
      assert.strictEqual(cart._items.length, 2);
      cart.remove(item1);
      assert.strictEqual(cart._items.length, 1);
      cart.remove('item2');
      assert.strictEqual(cart._items.length, 0);
    });
    it('should handle incorrect values', function() {
      var cart = new Cart().on('error', function(){});
      assert.doesNotThrow(function() {
        cart.remove();
        cart.remove(null);
        cart.remove(void 0);
        cart.remove({});
        cart.remove(new Cart.Item());
      });
    });
    it('should allow removing items as parameters', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , cart = new Cart([item1, item2]);
      assert.strictEqual(cart._items.length, 2);
      cart.remove(item1, item2);
      assert.strictEqual(cart._items.length, 0);
    });
    it('should allow removing items as an array', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , cart = new Cart([item1, item2]);
      assert.strictEqual(cart._items.length, 2);
      cart.remove([item1, item2]);
      assert.strictEqual(cart._items.length, 0);
    });
    it('should not allow removing if locked', function() {
      var cart = new Cart();
      cart.lock(true);
      assert.throws(function() {
        cart.remove();
      }, Error);
    });
  });

  describe('#removeIndex()', function(){
    it('should remove by index', function() {
      var cart = new Cart([{}, {}]);
      assert.strictEqual(cart._items.length, 2);
      cart.removeIndex(0);
      assert.strictEqual(cart._items.length, 1);
      cart.removeIndex(0);
      assert.strictEqual(cart._items.length, 0);
    });
    it('should handle incorrect values', function() {
      var cart = new Cart();
      assert.doesNotThrow(function() {
        cart.removeIndex();
        cart.removeIndex(-1);
        cart.removeIndex(null);
        cart.removeIndex(void 0);
        cart.removeIndex({});
        cart.removeIndex(new Cart.Item());
      });
    });
    it('should not allow removing if locked', function() {
      var cart = new Cart([{}]);
      cart.lock(true);
      assert.throws(function() {
        cart.removeIndex(0);
      }, Error);
    });
  });

  describe('#findBy()', function(){
    it('should find items by property value', function() {
      var item1 = new Cart.Item({ product: 'item1' })
        , item2 = new Cart.Item({ product: 'item2' })
        , cart = new Cart([item1, item2]);
      assert.strictEqual(item1, cart.findBy('product', 'item1'));
      assert.strictEqual(item2, cart.findBy('product', 'item2'));
      assert.strictEqual(null, cart.findBy('product', 'nonexistent'));
    });
  });

  describe('#find()', function(){
    it('should find items by id', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item({ id: 'item2' })
        , cart = new Cart([item1, item2])
        , autoId = item1.id;
      assert.strictEqual(item1, cart.find(autoId));
      assert.strictEqual(item2, cart.find('item2'));
      assert.strictEqual(null, cart.find('nonexistent'));
    });
  });

  describe('#clear()', function(){
    it('should allow clearing items', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , cart = new Cart([item1, item2]);
      assert.strictEqual(cart._items.length, 2);
      cart.clear();
      assert.strictEqual(cart._items.length, 0);
    });
    it('should not allow clearing if locked', function() {
      var cart = new Cart([{}]);
      cart.lock(true);
      assert.throws(function() {
        cart.clear();
      }, Error);
    });
  });

  describe('#purchase()', function(){
    it('should error if cart empty (default options.paymentDriver remains)', function(done) {
      var cart = new Cart().on('error', function(err) {
        assert.strictEqual(err instanceof Error, true);
        done();
      });
      cart.purchase();
      assert.strictEqual(cart.locked, false);
    });
    it('should error if no paymentDriver passed', function(done) {
      var cart = new Cart([{}]).on('error', function(err) {
        assert.strictEqual(err instanceof Error, true);
        done();
      });
      cart.purchase();
      assert.strictEqual(cart.locked, false);
    });
    it('should lock the cart and items', function() {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , cart = new Cart([item1, item2], { paymentDriver: successfulPaymentDriver });
      cart.purchase();
      assert.strictEqual(cart.locked, true);
      assert.strictEqual(cart._items[0].locked, true);
      assert.strictEqual(cart._items[1].locked, true);
    });
    it('should not allow purchasing if locked', function() {
      var cart = new Cart([{}]);
      cart.lock(true);
      assert.throws(function() {
        cart.purchase();
      }, Error);
      assert.strictEqual(cart.locked, true); // should not auto unlock
    });
    it('should accept a callback', function(done) {
      var item1 = new Cart.Item()
        , item2 = new Cart.Item()
        , cart = new Cart([item1, item2], { paymentDriver: successfulPaymentDriver });
      cart.purchase(function(err, successful) {
        assert.ifError(err);
        assert.strictEqual(successful, true);
        done();
      });
    });
  });

  describe('#toJSON()', function(){
    it('should convert to JSON and back', function() {
      var item1 = new Cart.Item({ product: 'item1' })
        , item2 = new Cart.Item({ product: 'item2' })
        , cart = new Cart([item1, item2])
        , cart2 = Cart.from(cart.toJSON());

      assert.strictEqual(cart._items.length, cart2._items.length);
      assert.strictEqual(cart._items[0].product, cart2._items[0].product);
      assert.deepEqual(cart.itemAt(0).product, cart2.itemAt(0).product);
      assert.deepEqual(cart.itemAt(1).product, cart2.itemAt(1).product);
    });
  });
});
