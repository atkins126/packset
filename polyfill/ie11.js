// ie11.js

if (typeof Promise === 'undefined') {
  require('promise/lib/rejection-tracking').enable();
  if (typeof window !== 'undefined') {
    window.Promise = require('promise/lib/es6-extensions.js');
  }
}

if (typeof window !== 'undefined') {
  require('whatwg-fetch');
}

Object.assign = require('object-assign');

require('core-js/features/symbol');
require('core-js/features/array/from');
