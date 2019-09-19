// ie9.js

require('./ie11');
require('core-js/features/map');
require('core-js/features/set');
if (typeof window !== 'undefined') {
  require('raf').polyfill(window);
}
