/*
 * Title: Station List
 * Description: Remove stations from station list
 *
 */


define('stationList', ['jquery', 'Favorites'], function ($, Favorites) {
  'use strict';

  var StationList = function($el, options) {
    this.$el = $el;
    this.$removeBtn = this.$el.find('.js-StationList-remove');

    this.eventListeners();
  };

  StationList.prototype = {
    eventListeners: function() {
      var _this = this;

      this.$removeBtn.click(function(e) {
        var $item = $(this).closest('.js-StationList-item');

        e.preventDefault();

        _this.removeStation($item);
      });
    },

    removeStation: function($item) {
      var id = $item.data('station-id');

      Favorites.remove(id);

      $item.slideUp(200);
    }
  };

  return {
    init: function ($el, options) {
      new StationList($el, options);
    }
  };
});
