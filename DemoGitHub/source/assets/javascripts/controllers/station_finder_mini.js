/*
 * Title: Station Finder Mini
 * Description: Station finder widget
 *
 */

define('stationFinderMini', ['jquery', 'googleMaps', 'helpers', 'Analytics'], function ($, googleMaps, helpers, Analytics) {
  'use strict';

  var StationFinderMini = function($el, options) {
    this.$el = $el;
    this.options = options;

    this.$form = this.$el.find('.js-StationFinderMini-searchForm');
    this.$placeSearch = this.$el.find('.js-StationFinderMini-searchInput');
    this.setupSearch();
    this.eventListeners();
  };

  StationFinderMini.prototype = {
    setupSearch: function() {
      this.autocomplete = new googleMaps.places.Autocomplete(
        this.$placeSearch.get(0),
        {
          componentRestrictions: {
            country: 'se'
          }
        }
      );

      // add on enter hack
      helpers.selectFirstOptionOnEnter(this.$placeSearch.get(0));
    },

    eventListeners: function() {
      var _this = this;

      googleMaps.event.addListener(
        this.autocomplete,
        'place_changed',
        function() {
          _this.onLocationChange();
        }
      );

      this.$form.on('submit', function(e) {
        e.preventDefault();
      });
    },

    onLocationChange: function() {
      var
        location = this.autocomplete.getPlace().geometry.location,
        latlng = location.lat() + ',' + location.lng(),
        baseUrl = this.options.stationFinderUrl,
        searchVal = this.$placeSearch.val(),
        query = {
          search: searchVal,
          searchLatLng: latlng,
          showClosestToSearch: true
        },
        url = baseUrl + '#' + $.param(query);

      Analytics.track({
          category: 'Hitta Station - Widget',
        action: 'Sök plats',
        label: searchVal
      });

      window.location = url;
    }
  };

  return {
    init: function ($el, options) {
      new StationFinderMini($el, options);
    }
  };
});
