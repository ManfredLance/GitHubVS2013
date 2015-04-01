/*
 * Title: Station Map
 * Description: Load a static or interactive map
 *
 */


define('stationMap', ['jquery', 'breakpoints', 'googleMaps', 'Map', 'StationModel'], function ($, Breakpoints, googleMaps, Map, StationModel) {
  'use strict';

  var StationMap = function($el, options) {
    this.$el = $el;
    this.model = new StationModel();
    this.lat = options.lat;
    this.lng = options.lng;
    this.stationSort = options.stationSort;
    this.findStationUrl = options.findStationUrl;
    this.hasStaticMap = false;
    this.hasInteractiveMap = false;

    this.loadMap();
    this.eventListeners();
  };

  StationMap.prototype = {
    eventListeners: function() {
      var _this = this;

      $(Breakpoints).on('change', function() {
        _this.onBreakpointChange();
      });
    },

    loadInteractiveMap: function() {
      var latLng = new googleMaps.LatLng(this.lat, this.lng);
      this.map = new Map(this.$el, {
        center: latLng,
        zoom: 14
      });
      this.addStationToMap();
      this.hasInteractiveMap = true;
      this.hasStaticMap = false;
    },

    loadStaticMap: function() {
      var markerClass = 'Station-mapMarker';

      if (this.stationSort === 'Såifa') {
        markerClass += ' Station-mapMarker--saifa';
      }

      this.$el.html(
        '<a href="' + this.findStationUrl + '">' +
        '<img src="//maps.googleapis.com/maps/api/staticmap?center=' + this.lat + ', ' + this.lng + '&amp;zoom=16&amp;size=584x140&amp;sensor=false" class="u-stretch">' +
        '<span class="' + markerClass + '">Stationens position</span>' +
        '</a>'
      );
      this.hasStaticMap = true;
      this.hasInteractiveMap = false;
    },

    loadMap: function() {
      if (Breakpoints.isAbove('small') && !this.hasInteractiveMap) {
        this.loadInteractiveMap();
      } else if (Breakpoints.isBetween('zero-to-small') && !this.hasStaticMap) {
        this.loadStaticMap();
      }
    },

    onBreakpointChange: function() {
      this.loadMap();
    },

    addStationToMap: function() {
      this.map.addMarker(this.lat, this.lng, this.getStationIcon(), 1, null);
    },

    getStationIcon: function() {
      var markerImageData = this.model.getMarkerImageData({
        StationSort: this.stationSort
      });

      return this.map.getMarkerImage(markerImageData);
    }
  };

  return {
    init: function ($el, options) {
      new StationMap($el, options);
    }
  };
});
