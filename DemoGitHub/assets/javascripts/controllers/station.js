/*
 * Title: Station
 * Description: Single station controller
 *
 */


define('station', ['modernizr', 'jquery', 'Favorites', 'helpers'], function(Modernizr, $, Favorites, helpers) {
  'use strict';

  var Station = function($el, options) {
    this.$el = $el;
    this.$favorite = $el.find('.js-Station--favorite');
    this.$distanceContainer = this.$el.find('.js-Station-distanceContainer');
    this.$distance = this.$distanceContainer.find('.js-Station-distance');

    this.id = options.id;
    this.lat = options.lat;
    this.lng = options.lng;
    this.hasDistanceClass = 'Station-distanceContainer--has-distance';
    this.isFavoriteClass = 'ActionBar-action--favorite--is-favorite';

    this.updateFavoriteButton();

    this.eventListeners();

    if (Modernizr.geolocation) {
      this.showDistanceFromUser();
    }
  };

  Station.prototype = {
    updateFavoriteButton: function() {
      var
        data = this.$favorite.data(),
        text;

      if (Favorites.isFavorite(this.id)) {
        text = data.favoriteRemoveText;
        this.$favorite.addClass(this.isFavoriteClass);
      } else {
        text = data.favoriteAddText;
        this.$favorite.removeClass(this.isFavoriteClass);
      }

      this.$favorite.find('.js-Station--favoriteText').text(text);
    },

    eventListeners: function() {
      var _this = this;

      this.$favorite.click(function(e) {
        e.preventDefault();
        _this.onFavoriteClick();
      });
    },

    onFavoriteClick: function() {
      if (Favorites.isFavorite(this.id)) {
        Favorites.remove(this.id);
      } else {
        Favorites.add(this.id);
      }
      this.updateFavoriteButton();
    },

    showDistanceFromUser: function() {
      var _this = this;

      helpers.getDistanceFromUser(this.lat, this.lng, function(distance) {
        _this.$distance.html(distance);
        _this.$distanceContainer.addClass(_this.hasDistanceClass);
      });
    }
  };

  return {
    init: function ($el, options) {
      new Station($el, options);
    }
  };
});
