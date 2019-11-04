// ie11.js

// https://babeljs.io/docs/en/babel-polyfill
// core-js/stable not working (why?), must add next line to the top of your entry file.
// require('core-js/stable');
require('regenerator-runtime/runtime');

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
