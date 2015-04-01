/**
 * Preem main
 * Configures and initializes application
 */

(function (require) {
  'use strict';

  // Initialize helpers
  require([
    'helpers'
  ], function (helpers) {
    helpers.init();
  });

  // Initialize controllers
  require([
    'controllerInitializer'
  ], function (controllerInitializer) {
    controllerInitializer.init();
  });

}(require));
