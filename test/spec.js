/**
 * cart
 *
 *    Library test
 */

'use strict'

var assert = require('assert'),
lib        = require('../lib/cart');

describe('Basic library test', function() {
  it('should answer all questions with YO!', function() {
    var answer = lib.cart('Should I tickle this unicorn?');
    assert.equal(answer,'YO!');
  })
})
