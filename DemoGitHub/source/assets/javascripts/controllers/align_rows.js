/*
 * Title: Align Rows
 * Description: Align elements vertically in a row
 *
 */

define('alignRows', ['jquery', 'helpers', 'breakpoints', 'imagesLoaded'], function ($, helpers, Breakpoints, imagesLoaded) {
  'use strict';

  var AlignRows = function($el, options) {
    this.$el = $el;

    this.options = options;

    if (Breakpoints.isAbove(this.options.aboveBreakpoint)) {
      this.alignAll();
    }
    this.eventListeners();
  };

  AlignRows.prototype = {
    alignAll: function() {
      var
        _this = this,
        i,
        rows = this.options.rows;

      for (i = 0; i < rows.length; i++) {
        _this.alignClass(rows[i].className, rows[i].elementsPerRow);
      }
    },

    alignClass: function(className, elementsPerRow) {
      var
        _this = this,
        i,
        $els = this.$el.find('.' + className),
        chunks = helpers.arrayChunk($.makeArray($els), elementsPerRow);

      for (i = 0; i < chunks.length; i++) {
        _this.alignRow(chunks[i]);
      }
    },

    alignRow: function(row) {
      var
        i,
        rowHeights = [],
        highest = 0;

      // get heights
      for (i = row.length - 1; i >= 0; i--) {
        rowHeights.push($(row[i]).height());
      }

      highest = helpers.arrayMax(rowHeights);

      // set heights
      for (i = row.length - 1; i >= 0; i--) {
        $(row[i]).height(highest);
      }
    },

    resetRows: function() {
      var
        _this = this,
        i,
        rows = this.options.rows;

      for (i = 0; i < rows.length; i++) {
        var $els = _this.$el.find('.' + rows[i].className);

        helpers.removeProperty($els, 'height');
      }
    },

    eventListeners: function() {
      var _this = this;

      $(window).on('debouncedresize', function() {
        _this.reAlign();
      });

      this.$el.imagesLoaded().always(function() {
        _this.reAlign();
      }).progress(function() {
        _this.reAlign();
      });
    },

    reAlign: function() {
      this.resetRows();
      if (Breakpoints.isAbove(this.options.aboveBreakpoint)) {
        this.alignAll();
      }
    }
  };

  return {
    init: function ($el, options) {
      new AlignRows($el, options);
    }
  };
});
