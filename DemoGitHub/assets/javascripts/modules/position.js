/*
 * Title: Position
 * Description: Save geolocation position for later use
 *
 */


define('position', ['jquery', 'Analytics'], function($, Analytics) {
  'use strict';

  // singleton instance
  var instance;

  function Position() {
    this.lat = null;
    this.lng = null;
  }

  Position.prototype = {
    get: function(callback, error) {
      var _this = this;

      if (this.lat && this.lng) {
        if (typeof callback === 'function') {
          callback(this.lat, this.lng);
        }
      } else if (Modernizr.geolocation) {
        navigator.geolocation.getCurrentPosition(function(geoposition) {
          _this.lat = geoposition.coords.latitude;
          _this.lng = geoposition.coords.longitude;

          if (typeof callback === 'function') {
            callback(_this.lat, _this.lng);
          }

          // trigger a on position event
          $(_this).trigger('position', [_this.lat, _this.lng]);

          Analytics.track({
            category: 'Lokalisera Min Plats',
            action: 'Tillåt min plats'
          });
        }, function() {
          if (typeof error === 'function') {
            error();
          }

          // trigger error event
          $(_this).trigger('error');

          Analytics.track({
            category: 'Lokalisera Min Plats',
            action: 'Tillåt ej min plats'
          });
        });
      }
    }
  };

  // only create instance once: singleton
  return (instance = (instance || new Position()));
});
