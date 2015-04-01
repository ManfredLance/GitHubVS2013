/*
 * Title: Toggler
 * Description: Toggle a class of an element
 *
 */

define('toggler', ['jquery'], function ($) {
  'use strict';

  var Toggler = function($el, options) {
    this.$el = $el;
    this.$targetEl = $(options.selector);

    this.toggleClass = options.className;
    this.toggleText = options.toggleText;
    this.clickElActiveClass = options.clickElActiveClass || 'active';
    this.group = options.group;

    this.eventListeners();
    this._addGroupClass();
  };

  Toggler.prototype = {
    eventListeners: function() {
      var _this = this;

      this.$el.click(function(e) {
        e.preventDefault();

        if (_this.isOn()) {
          _this.toggleOff();
        } else {
          _this.toggleOn();
        }

        _this.$el.trigger('onToggleTrigger', [_this.isOn(), e]);
        _this.$targetEl.trigger('onToggleTarget', [_this.isOn()]);
      });
    },

    isOn: function() {
      return this.$targetEl.hasClass(this.toggleClass);
    },

    toggleOn: function() {
      if (this.group) {
        $('.'+this.group).each(function() {
          var c = $(this).data('controller');
          c.$targetEl.removeClass(c.toggleClass);
          c.$el.removeClass(c.clickElActiveClass);
        });
      }

      if (!this.$el.hasClass(this.clickElActiveClass)) {
        this.switchToggleText();
      }

      this.$targetEl.addClass(this.toggleClass);
      this.$el.addClass(this.clickElActiveClass);
    },

    toggleOff: function() {
      if (this.$el.hasClass(this.clickElActiveClass)) {
        this.switchToggleText();
      }

      this.$targetEl.removeClass(this.toggleClass);
      this.$el.removeClass(this.clickElActiveClass);
    },

    switchToggleText: function() {
      if (this.toggleText) {
        var currentText = this.$el.html();
        this.$el.html(this.toggleText);
        this.toggleText = currentText;
      }
    },

    _addGroupClass: function() {
      if (this.group) {
        this.$el.addClass(this.group);
      }
    }
  };

  return {
    init: function ($el, options) {
      $el.data('controller', new Toggler($el, options));
    }
  };
});
