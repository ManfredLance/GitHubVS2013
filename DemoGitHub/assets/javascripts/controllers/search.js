/*
 * Title: Search
 * Description: Behaviour for search area
 *
 */


define('search', ['jquery'], function ($) {
  'use strict';

  var Search = function($el, options) {
    this.$el = $el;
    this.$input = $el.find('.js-Search-field');
    this.$toggler = $('.js-searchToggler');

    this.eventListeners();
  };

  Search.prototype = {
    eventListeners: function() {
      var _this = this;

      this.$toggler.on('onToggleTrigger', function(e, isOpen) {
        if (isOpen) {
          _this.$input.focus();
        } else {
          _this.$input.blur();
        }
      });
    }
  };

  return {
    init: function ($el, options) {
      new Search($el, options);
    }
  };
});
