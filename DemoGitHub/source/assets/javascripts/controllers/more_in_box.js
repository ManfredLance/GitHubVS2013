/*
 * Title: More In Box
 * Description: Add ability to expand a box if content overflows it
 *
 */

define('moreInBox', ['jquery'], function ($) {
  'use strict';

  var MoreInBox = function($el, options) {
    this.$el = $el;
    this.$btn = $el.find('.js-moreInBox-btn');
    this.$overflowEl = this.$el.find(options.overflowSelector);

    this.overflowClass = options.overflowClass;
    this.openClass = options.openClass;
    this.isOpen = false;

    this.checkOverflow();
    this.eventListeners();
  };

  MoreInBox.prototype = {
    eventListeners: function() {
      var _this = this;

      this.$btn.click(function(e) {
        e.preventDefault();

        _this.onBtnClick();
      });

      $(window).on('debouncedresize', function() {
        _this.onWindowResize();
      });
    },

    showMore: function() {
      this.$el.addClass(this.openClass);

      this.isOpen = true;
    },

    showLess: function() {
      this.$el.removeClass(this.openClass);

      this.isOpen = false;
    },

    onBtnClick: function() {
      if (this.isOpen) {
        this.showLess();
      } else {
        if (this.isOverflowing()) {
          this.showMore();
        }
      }
    },

    onWindowResize: function() {
      this.showLess();
      this.checkOverflow();
    },

    checkOverflow: function() {
      if (this.isOverflowing()) {
        this.$el.addClass(this.overflowClass);
      } else {
        this.$el.removeClass(this.overflowClass);
      }
    },

    isOverflowing: function() {
      return this.$overflowEl.height() > this.$el.height();
    }
  };

  return {
    init: function ($el, options) {
      new MoreInBox($el, options);
    }
  };
});
