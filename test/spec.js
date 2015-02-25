/**
 * cart
 *
 *    Library test
 */

'use strict'

var assert = require('assert'),
Cart        = require('../lib/cart');

describe('Cart', function() {

  describe('toArray()', function() {
    it('should take arguments and return an array', function() {
      var result = Cart.utils.toArray(arguments);
      assert.strictEqual(toString.call(result), '[object Array]');
    });

    it('should accept an array', function() {
      var arr = [];
      var result = Cart.utils.toArray(arr);
      assert.strictEqual(toString.call(result), '[object Array]');
    });

    it('should wrap non array-like objs', function() {
      assert.strictEqual(toString.call(Cart.utils.toArray('string')), '[object Array]');
      assert.strictEqual(toString.call(Cart.utils.toArray(Infinity)), '[object Array]');
      assert.strictEqual(toString.call(Cart.utils.toArray(-Infinity)), '[object Array]');
      assert.strictEqual(toString.call(Cart.utils.toArray(Number.MAX_VALUE)), '[object Array]');
      assert.strictEqual(toString.call(Cart.utils.toArray(Number.MIN_VALUE)), '[object Array]');
      assert.strictEqual(toString.call(Cart.utils.toArray(1.1)), '[object Array]');
      assert.strictEqual(toString.call(Cart.utils.toArray(true)), '[object Array]');
      assert.strictEqual(toString.call(Cart.utils.toArray(false)), '[object Array]');
      assert.strictEqual(toString.call(Cart.utils.toArray(null)), '[object Array]');
      assert.strictEqual(toString.call(Cart.utils.toArray(void 0)), '[object Array]');
    });

    it('should never return reference to the input', function() {
      var arr = []
        , obj = {};
      assert.notStrictEqual(Cart.utils.toArray(arr), arr);
      assert.notStrictEqual(Cart.utils.toArray(obj), obj);
      assert.notStrictEqual(Cart.utils.toArray(arguments), arguments);
    });
  });

  describe('applyProperties()', function() {
    it('should extend an object', function() {
      var obj1 = { a: null }
        , obj2 = { a: 1 };
      Cart.utils.applyProperties(obj1, obj2, new Error('Invalid Cart property passed'));
      assert.strictEqual(obj1.a, obj2.a);
    });

    it('should throw if invalid key exists', function() {
      var obj1 = { a: null }
        , obj2 = { a: 1, errkey: null };
      assert.throws(function() {
        Cart.utils.applyProperties(obj1, obj2, new Error('Invalid Cart property passed'));
      }, Error);
    });
  });
});
