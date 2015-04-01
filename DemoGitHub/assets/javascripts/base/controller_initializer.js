/**
 * Site wide controller intializer
 * Parses a context for controllers and initializes them
 */


define('controllerInitializer', ['jquery'], function ($) {
  return {
    init: function ($context) {
      var
        _this = this,
        selector = '[data-controller]',
        $controllers;

      if ($context) {
        $controllers = $context.find(selector).addBack().filter(selector);

        // If the context is a collection it self and not a single container,
        // filter through it
        if ($controllers.length === 0 && $context.length > 1) {
          $controllers = $context.filter(selector);
        }
      } else {
        $controllers = $(selector);
      }

      // Remove any initialized controllers
      $controllers = $controllers.filter(function (i) {
        return $controllers.eq(i).data('initialized') !== true;
      });

      // Parse each controller
      $controllers.each(function () {
        _this.parse($(this));
      });
    },

    parse: function ($el) {
      var
        _this = this,
        data = $el.data('controller'),
        name,
        options;

      if (typeof data === 'string') {
        name = data;
        this.initializeController(name, $el, null);
      } else {
        $.each(data, function (k, v) {
          name = Object.keys(v)[0];
          options = v[name];
          _this.initializeController(name, $el, options);
        });
      }
    },

    initializeController: function (name, $el, options) {
      require([name], function (controller) {
        controller.init($el, options);
        $el.data('initialized', true);
      }, function (err) {
        throw(new Error('Failed to load controller: ' + name));
      });
    }
  };
});
