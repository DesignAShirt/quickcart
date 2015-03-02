#!/usr/bin/env node
'use strict';

var path = require('path');

var fse = require('fs-extra')
  , inquirer = require('inquirer');

var pkg = require(path.join(__dirname, 'package.json'));

var version = pkg.version;

fse.copySync('./dist/quickcart.v' + version + '.js', './quickcart.js', { clobber: true });

var release = {
  npm: function() {

  },

  bower: function() {

  },

  component: function() {

  }
};

inquirer.prompt([
  {
    type: 'confirm',
    name: 'npm',
    message: 'Release to npm?',
    default: false
  },
  {
    type: 'confirm',
    name: 'bower',
    message: 'Release to bower?',
    default: false
  },
  {
    type: 'confirm',
    name: 'component',
    message: 'Release to component?',
    default: false
  },
], function(answers) {
  for (var k in answers) {
    if (answers[k]) {
      release[k]();
    }
  }
});
