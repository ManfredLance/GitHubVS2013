/*
 * Title: Clear Input
 * Description: Clear all inputs within controller
 *
 */


define('clearInput', ['jquery'], function ($) {
  'use strict';

  var ClearInput = function($el) {
    this.$el = $el;
    this.$input = this.$el.find('input');
    this.$clearBtn = this.$el.find('.js-clearInputBtn');
    this.hasCleared = false;

    this.showOrHideClear();
    this.eventListeners();
  };

  ClearInput.prototype = {
    eventListeners: function() {
      var _this = this;

      this.$clearBtn.click(function(e) {
        e.preventDefault();
        _this.onClear();
      });

      this.$input.keyup(function() {
        _this.showOrHideClear();
        _this.hasCleared = false;
      }).blur(function() {
        _this.onInputBlur();
      });
    },

    onInputBlur: function() {
      var _this = this;

      if (this.hasCleared) {
        setTimeout(function() {
          _this.$input.val('');
        }, 0);
      }
    },

    onClear: function() {
      var _this = this;

      this.hasCleared = true;

      this.hideClear();
      this.$input.val('').focus();
    },

    showOrHideClear: function() {
      if (!!this.$input.val().length) {
        this.showClear();
      } else {
        this.hideClear();
      }
    },

    showClear: function() {
      this.$clearBtn.show();
    },

    hideClear: function() {
      this.$clearBtn.hide();
    }
  };

  return {
    init: function ($el, options) {
      new ClearInput($el, options);
    }
  };
});
