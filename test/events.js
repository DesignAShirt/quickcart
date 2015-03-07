/**
 * cart
 *
 *    Library test
 */

'use strict'

var assert = require('assert')
  , Cart = require('../lib/cart.js')
  , Item = Cart.Item;

describe('Cart', function() {
  it('should emit events for things when stuff happens');
});

describe('Item', function() {
  it('should emit events for things when stuff happens');
});

// check if add/remove conditionally fires all events based on whether something actually happened
