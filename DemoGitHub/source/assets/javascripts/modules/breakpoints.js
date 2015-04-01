/*
 * Title: Breakpoints
 * Description: Determen the breakpoint that is currently active
 *
 */

define('breakpoints', ['jquery'], function($) {
  'use strict';

  var Breakpoints = {
    isBetween: function(val) {
      return val === this._getBetweenValue();
    },

    isAbove: function(val) {
      return $.inArray(val, this._getAboveValue().split(',')) !== -1;
    },

    /***** Private *****/

    _breakpointsEl: null,

    _init: function() {
      this._$win = $(window);
      this._createBreakpointsEl();
      this._breakpointsEl = $('.Breakpoints').get(0);
      this._betweenValue = this._getBetweenValue();
      this._aboveValue = this._getAboveValue();
      this._eventListeners();
    },

    _createBreakpointsEl: function() {
      $('<div class="Breakpoints"></div>').appendTo('body');
    },

    _eventListeners: function() {
      var _this = this;

      this._$win.resize(function() {
        _this._checkForChange();
      });
    },

    _getBreakpointContent: function(type) {
      return window
        .getComputedStyle(this._breakpointsEl, type)
        .getPropertyValue('content')
        .replace(/['"]+/g, ''); // Remove single and double quotes from content
    },

    _getBetweenValue: function() {
      var val;

      if (typeof window.getComputedStyle === 'function') {
        val = this._getBreakpointContent(':before');
      } else {
        // Assume value if we cant get value from pseudo element
        val = '';
      }

      return val;
    },

    _getAboveValue: function() {
      var val;

      if (typeof window.getComputedStyle === 'function') {
        val = this._getBreakpointContent(':after');
      } else {
        // Assume value if we cant get value from pseudo element
        val = 'small,medium';
      }

      return val;
    },

    _checkForChange: function() {
      var
        wasBetween = this._betweenValue,
        wasAbove = this._aboveValue,
        isBetween = this._getBetweenValue(),
        isAbove = this._getAboveValue();

      if ((wasBetween !== isBetween) || (wasAbove !== isAbove)) {
        this._betweenValue = isBetween;
        this._aboveValue = isAbove;

        $(this).trigger('change');
      }
    }
  };

  Breakpoints._init();

  return Breakpoints;
});
