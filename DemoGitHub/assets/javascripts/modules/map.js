/*
 * Title: Map
 * Description: Initialize and work with Google Maps
 *
 */


define('Map', ['modernizr', 'jquery', 'googleMaps', 'helpers', 'position'], function (Modernizr, $, googleMaps, helpers, position) {
  'use strict';

  function Map($el, options) {
    this.$el = $el;
    this.map = null;
    this.options = $.extend({
      minZoom: 3,
      maxZoom: 17,
      zoom: 5,
      mapTypeId: googleMaps.MapTypeId.ROADMAP,
      center: this.getMapLatLng(62.247179970970535, 17.69381999999996),
      streetViewControl: false,
      mapTypeControl: false,
      panControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.LEFT_BOTTOM
      },
      // value to increase the bounds used in .showClosestMarker
      increaseBoundsValue: 0.045
    }, options);

    this.render();
  }

  Map.prototype = {
    render: function(el) {
      this.map = new googleMaps.Map(this.$el.get(0), this.options);
    },

    addListenerOnce: function(name, callback) {
      googleMaps.event.addListenerOnce(this.map, name, callback);
    },

    getMapLatLng: function(lat, lng) {
      return new googleMaps.LatLng(lat, lng);
    },

    getUserLocation: function(callback, onError) {
      var
        _this = this,
        iconPath = '/assets/images/map_markers/user_location.png',
        icon = this.getMarkerImage({
          path: iconPath,
          width: 70,
          height: 70,
          anchor: new google.maps.Point(35, 35)
        });

      if (Modernizr.geolocation) {
        if (position.lat && position.lng) {
          onLatLng.call(null, position.lat, position.lng);
        } else {
          $(position).on('position', function(e, lat, lng) {
            onLatLng.call(null, lat, lng);
          }).on('error', onError);
        }
      }

      // on lat lng callback
      function onLatLng(lat, lng) {
        if (_this.positionMarker) {
          _this.positionMarker.setPosition(new googleMaps.LatLng(lat, lng));
        } else {
          _this.positionMarker = _this.addMarker(lat, lng, icon, 2);
        }

        if (typeof callback === 'function') {
          callback.call(null, lat, lng, _this.positionMarker);
        }
      }
    },

    getMarkerImage: function(data) {
      var size = new googleMaps.Size(data.width, data.height);

      return new googleMaps.MarkerImage(data.path, null, null, data.anchor, size);
    },

    addMarker: function(lat, lng, icon, zIndex, data, onClick) {
      var
        position = this.getMapLatLng(lat, lng),
        isClickable = typeof(onClick) === 'function',
        marker = new googleMaps.Marker({
          position: position,
          map: this.map,
          data: data,
          icon: icon,
          zIndex: zIndex,
          clickable: isClickable,
          optimized: true
        });

      if (isClickable) {
        googleMaps.event.addListener(marker, 'click', onClick);
      }

      return marker;
    },

    showMarkers: function(markers) {
      for (var i = markers.length - 1; i >= 0; i--) {
        markers[i].setVisible(true);
      }
    },

    hideMarkers: function(markers) {
      for (var i = markers.length - 1; i >= 0; i--) {
        markers[i].setVisible(false);
      }
    },

    fitToMarkers: function(markers) {
      if (markers.length) {
        var
          bounds = new googleMaps.LatLngBounds(),
          i;

        for (i = markers.length - 1; i >= 0; i--) {
          bounds.extend(markers[i].getPosition());
        }

        this.map.fitBounds(bounds);
      }
    },

    panTo: function(lat, lng) {
      this.map.panTo(new googleMaps.LatLng(lat, lng));
    },

    setupSearch: function(input, onPlaceChange) {
      var
        autocomplete,
        i;

      if (!$.isArray(input)) {
        input = [input];
      }

      for (i = input.length - 1; i >= 0; i--) {
        autocomplete = new googleMaps.places.Autocomplete(
          input[i],
          {
            componentRestrictions: {
              country: 'se'
            }
          }
        );
        autocomplete.bindTo('bounds', this.map);

        googleMaps.event.addListener(
          autocomplete,
          'place_changed',
          onPlaceChange
        );

        helpers.selectFirstOptionOnEnter(input[i]);
      }
    },

    showClosestMarker: function(position, closestMarker) {
      var bounds = new googleMaps.LatLngBounds();

      bounds.extend(position);

      if (closestMarker) {
        bounds.extend(closestMarker.getPosition());
        bounds.extend(this.getOppositeToClosest(position, closestMarker));
      }

      // increase the bounds (make the bounds a bit bigger)
      this.increaseBounds(bounds, this.options.increaseBoundsValue);
      this.map.fitBounds(bounds);
    },

    showMarkersAtPath: function(closeMarkers, markers) {
      this.hideMarkers(markers);
      this.showMarkers(closeMarkers);
    },

    getOppositeToClosest: function(centerPosition, closestMarker) {
      var
        diffLat = centerPosition.lat() - closestMarker.position.lat(),
        diffLng = centerPosition.lng() - closestMarker.position.lng(),
        oppositeLat = centerPosition.lat() + diffLat,
        oppositeLng = centerPosition.lng() + diffLng;

      // Make sure values stays within min and max of lat and lng of google maps
      // https://groups.google.com/d/msg/google-maps-api/oJkyualxzyY/pNv1SE7qpBoJ
      if (oppositeLat < -85) {
        oppositeLat = -85;
      } else if (oppositeLat > 85) {
        oppositeLat = 85;
      }

      if (oppositeLng < -180) {
        oppositeLng = -180;
      } else if (oppositeLng > 180) {
        oppositeLng = 180;
      }

      return this.getMapLatLng(oppositeLat, oppositeLng);
    },

    findClosestMarker: function(location, markers) {
      var
        lat = location.lat(),
        lng = location.lng(),
        distances = [],
        closest = -1,
        i;

      for (i = 0; i < markers.length; i++) {
        var
          mlat = markers[i].position.lat(),
          mlng = markers[i].position.lng(),
          distance = helpers.getDistanceBetweenPoints(mlat, mlng, lat, lng);

        distances[i] = distance;

        if (closest === -1 || distance < distances[closest]) {
          closest = i;
        }
      }

      return markers[closest];
    },

    increaseBounds: function(bounds, increaseVal) {
      var
        nourthEast = bounds.getNorthEast(),
        southWest = bounds.getSouthWest(),
        newNourthEast = this.getMapLatLng(nourthEast.lat() + increaseVal, nourthEast.lng() - increaseVal),
        newSouthWest = this.getMapLatLng(southWest.lat() - increaseVal, southWest.lng() + increaseVal);

      bounds.extend(newNourthEast);
      bounds.extend(newSouthWest);

      return bounds;
    }
  };

  return Map;
});
