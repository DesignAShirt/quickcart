/**
 * cart
 *
 *    Library test
 */

'use strict'

var assert = require('assert')
  , Cart = require('../lib/cart.js')
  , Item = Cart.Item;

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
        , product = 2
        , price = 3
        , signature = 'four'
        , item;
      assert.doesNotThrow(function() {
        item = new Item({
          id: id,
          product: product,
          price: price,
          signature: signature,
          properties: { hello: value },
        });
      });
      assert.strictEqual(item.id, id);
      assert.strictEqual(item.product, product);
      assert.strictEqual(item.price, price);
      assert.strictEqual(item.signature, signature);
      assert.strictEqual(item.property('hello'), value);
    });
  });

  describe('#id', function(){
    it('should have an id', function() {
      assert.doesNotThrow(function() {
        new Item({ id: 'blah' });
      });
    });
    it('should auto generate an id if none passed', function() {
      assert.notEqual(new Item().id, null);
      assert.notEqual(new Item().id, false);
    });
  });

  describe('#product', function(){
    it('should have a product', function() {
      assert.notEqual(new Item().product, null);
      assert.notEqual(new Item().product, false);
    });
    it('should use the id if none passed', function() {
      var item = new Item();
      assert.strictEqual(item.product, item.id);
    });
  });

  describe('#price', function(){
    it('should have a price', function() {
      assert.strictEqual(new Item({ price: 100 }).price, 100);
    });
    it('should default to maximum value if none passed', function() {
      assert.strictEqual(new Item().price, Number.MAX_VALUE);
    });
    it('should support JIT price via function', function() {
      assert.strictEqual(new Item({ price: function() { return 100; } }).price, 100);
    });
  });

  describe('#quantity', function(){
    it('should have a quantity', function() {
      assert.strictEqual(new Item({ quantity: 100 }).quantity, 100);
    });
    it('should default to 1 if none passed', function() {
      assert.strictEqual(new Item().quantity, 1);
    });
  });

  describe('#signature', function(){
    it('should have a signature', function() {
      assert.strictEqual(new Item({ signature: 'hello' }).signature, 'hello');
    });
    it('should prevent changing price', function() {
      var item = new Item({ signature: 'hello', price: 100 });
      assert.throws(function() {
        item.price = 200;
        assert.strictEqual(item.price, 100);
      }, Error);
    });
  });

  describe('#group', function(){
    it('should have a group that defaults to null', function() {
      assert.strictEqual(new Item().group, null);
      assert.strictEqual(new Item({ group: 100 }).group, 100);
    });
  });

  describe('#shippable', function(){
    it('should have a shippable flag', function() {
      assert.strictEqual(new Item().shippable, true);
    });
  });

  describe('#countable', function(){
    it('should have a countable flag', function() {
      assert.strictEqual(new Item().countable, true);
    });
    it('should cause quantity to be zero', function() {
      assert.strictEqual(new Item({ countable: false }).quantity, 0);
    });
    it('should cause subtotal to be equal to price', function() {
      assert.strictEqual(new Item({ countable: false, price: 100 }).price, 100);
      assert.strictEqual(new Item({ countable: false, price: function() { return 100; } }).price, 100);
    });
  });

  describe('#taxable', function(){
    it('should have a taxable flag', function() {
      assert.strictEqual(new Item().taxable, true);
    });
  });

  describe('#subtotal', function(){
    it('should have a subtotal', function() {
      assert.notEqual(new Item().subtotal, null);
      assert.notEqual(new Item().subtotal, false);
    });
    it('should have a subtotal equal to the price when not countable', function() {
      var item = new Item({ price: 100, countable: false });
      assert.strictEqual(item.price, 100);
    });
  });

  describe('#locked', function(){
    it('should have a locked flag', function() {
      assert.strictEqual(new Item().locked, false);
    });
  });

  describe('#lock()', function(){
    it('should allow enabling lock and unlock', function() {
      var item = new Item();
      assert.doesNotThrow(function() {
        assert.strictEqual(item.locked, false);
        item.lock(true);
        assert.strictEqual(item.locked, true);
        item.lock(false);
        assert.strictEqual(item.locked, false);
      });
    });
  });

  describe('#properties', function(){
    it('should return copy of all the properties', function() {
      var properties = { hello: 'world', two: 3 }
        , item = new Item({ properties: properties });
      assert.notStrictEqual(item.properties, properties);
      assert.deepEqual(item.properties, properties);
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

  describe('#trigger()', function(){
    it('should allow events to be triggered', function(done) {
      var item = new Item();
      item.on('test event', function() {
        done();
      });
      item.trigger('test event');
    });
  });

  describe('#toJSON()', function(){
    it('should support toJSON', function() {
      var item = new Item();
      assert.strictEqual(item.product, item.toJSON().product);
    });
  });
});
