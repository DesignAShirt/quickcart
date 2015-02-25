/**
 * cart
 *
 *    Library test
 */

'use strict'

var assert = require('assert')
  , Cart = require('../lib/cart');

describe('Cart.utils', function() {
  describe('#toArray()', function() {
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
});

