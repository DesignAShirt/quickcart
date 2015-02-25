/**
 * cart
 *
 *    Library test
 */

'use strict'

var assert = require('assert')
  , Item = require('../lib/cart').Item;

describe('Item', function() {
  describe('#ctor()', function(){
    it('should instantiate', function() {
      var item = new Item();
      assert.strictEqual(true, item instanceof Item);
      assert.strictEqual(item.constructor, Item);
    });
    it('should auto id', function() {
      var item = new Item();
      assert.notEqual(item.id, false);
    });
    it('should accept obj as arg', function() {
      var value = 'world'
        , id = 1
        , price = 2
        , signature = 'three'
        , item;
      assert.doesNotThrow(function() {
        item = new Item({
          id: id,
          price: price,
          signature: signature,
          properties: { hello: value },
        });
      });
      assert.strictEqual(item.id, id);
      assert.strictEqual(item.price, price);
      assert.strictEqual(item.signature, signature);
      assert.strictEqual(item.property('hello'), value);
    });
  });

  describe('#property()', function(){
    it('should allow getting', function() {
      var value = value = 'hello'
        , item = new Item({ properties: { hello: value } });
      assert.strictEqual(item.property('hello'), value);
    });
    it('should allow setting', function() {
      var value = 'hello'
        , value2 = 'world'
        , item = new Item({ properties: { hello: value } });
      assert.strictEqual(item.property('hello'), value);
      item.property('hello', value2);
      assert.strictEqual(item.property('hello'), value2);
    });
    it('should support chaining multiple sets', function() {
      var value = 'hello'
        , value2 = 'world'
        , item = new Item();
      item
        .property('name', value)
        .property('description', value2);
      assert.strictEqual(item.property('name'), value);
      assert.strictEqual(item.property('description'), value2);
    });
    it('should trigger property:change events', function(done) {
      var value = 'hello'
        , value2 = 'world'
        , item = new Item({ properties: { the_key: value } });
      item.on('property:change', function(property, v, prev) {
        assert.strictEqual('the_key', property);
        assert.strictEqual(v, value2);
        assert.strictEqual(prev, value);
        done();
      });
      assert.strictEqual(item.property('the_key'), value);
      item.property('the_key', value2);
    });
  });
});
