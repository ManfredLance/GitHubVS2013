/*
 * Title: Station route
 * Description: Module to handle the route
 *
 */

define('StationFinderRoute', ['jquery', 'googleMaps', 'routeboxer', 'breakpoints', 'StationFinderUrl', 'position', 'Analytics'], function ($, googleMaps, RouteBoxer, Breakpoints, StationFinderUrl, position, Analytics) {
  'use strict';

  function StationFinderRoute(stationFinder) {
    this.$el = stationFinder.$el;
    this.$routeStartInput = this.$el.find('.js-StationFinder-routeStart');
    this.$routeEndInput = this.$el.find('.js-StationFinder-routeEnd');
    this.$routeClear = this.$el.find('.js-StationFinder-routeClear');
    this.$routeFlip = this.$el.find('.js-StationFinder-routeFlip');
    this.$closeBtn = this.$el.find('.js-StationFinder-route-closeBtn');
    this.$togglerBtn = $('.StationFinder-showRouteBtn');
    this.$submitBtn = this.$el.find('.js-StationFinder-route-submitBtn');
    this.$myLocationBtn = this.$el.find('.js-Route-myPositionBtn');

    this.stationFinder = stationFinder;
    this.options = stationFinder.options;
    this.map = stationFinder.map;
    this.url = stationFinder.url;

    this.directionsService = null;
    this.directionsRenderer = null;
    this.routeBoxer = new RouteBoxer();
    this.path = null;
    this.myPosStr = 'Min position';
    this.togglerBtnActiveClass = 'StationFinder-showRouteBtn--is-active';

    this._bindEvents();
    this._setupAutoCompletes();
  }

  StationFinderRoute.prototype = {
    plotRoute: function(directionOptions) {
      var
        _this = this,
        startVal = this.$routeStartInput.val(),
        endVal = this.$routeEndInput.val(),
        request = {
          origin: startVal === this.myPosStr ? this.$routeStartInput.data('latlng') : startVal,
          destination: endVal === this.myPosStr ? this.$routeEndInput.data('latlng') : endVal,
          travelMode: googleMaps.TravelMode.DRIVING
        };

      // clear old route if existing
      if (this.path) {
        this.directionsRenderer.setMap(null);
      }

      directionOptions = $.extend({
        map: this.map.map,
        preserveViewport: false
      }, directionOptions);

      this.directionsService = new googleMaps.DirectionsService();
      this.directionsRenderer = new googleMaps.DirectionsRenderer(directionOptions);

      this.directionsService.route(request, function(response, status) {
        if (status === googleMaps.DirectionsStatus.OK) {
          _this.directionsRenderer.setDirections(response);

          _this.path = response.routes[0].overview_path;

          _this.map.showMarkersAtPath(_this._getMarkersInPath(), _this.stationFinder.stationMarkers);

          _this._onUpdate();
          $(_this).trigger('plotroute');
        }
      });
    },

    showOnlyMarkersAtRoute: function() {
      if (this.path) {
        this.map.showMarkersAtPath(this._getMarkersInPath(), this.stationFinder.stationMarkers);
      }
    },

    _getMarkersInPath: function() {
      var
        i,
        j,
        boxes = this.routeBoxer.box(this.path, this.options.maxDistanceFromRoute),
        closeMarkers = [],
        markers = this.stationFinder.stationMarkers;

      for (i = 0; i < markers.length; i++) {
        var position = markers[i].getPosition();

        for (j = 0; j < boxes.length; j++) {
          if (boxes[j].contains(position)) {
            closeMarkers.push(markers[i]);
          }
        }
      }

      return closeMarkers;
    },

    _getIdsInPath: function() {
      var markers = this._getMarkersInPath();
      var ids = $.map(markers, function(val) {
        return val.data.id;
      });
      return ids;
    },

    _bindEvents: function() {
      var _this = this;

      this.$routeClear.click(function(e) {
        e.preventDefault();

        _this._onClearRoute();
      });

      this.$routeFlip.click(function(e) {
        _this._onFlipRoute();
      });

      this.$closeBtn.click(function(e) {
        _this.$togglerBtn.trigger('click');
      });

      this.$submitBtn.click(function(e) {
        if (!Breakpoints.isAbove('small')) {
          _this.$closeBtn.trigger('click');
        }
      });

      this.$myLocationBtn.click(function(e) {
        _this._onMyLocationClick(e);
      });

      // wait for the data til we restore the state
      $(this.stationFinder.model).one('onData', function() {
        _this._restoreState();
      });

      $(this.stationFinder.model).on('onData', function(e) {
        if (!_this.stationFinder.showOnlyFavorites) {
          _this.showOnlyMarkersAtRoute();
        }
      });

      if (Modernizr.geolocation) {
        $(position).on('position', function() {
          _this.$myLocationBtn.addClass('Route-myPositionBtn--has-position');
        });
      }

      $(window).on("pageshow", function(event) {
        if (event.originalEvent.persisted) {
          setTimeout(function() {
            _this.$routeStartInput.val(_this.url.get('routeStart'));
            _this.$routeEndInput.val(_this.url.get('routeEnd'));
          }, 0);
        }
      });

      this.url.setupChangeListener(this);
    },

    _setupAutoCompletes: function() {
      var
        _this = this,
        startInput = this.$routeStartInput.get(0),
        endInput = this.$routeEndInput.get(0);

      this.map.setupSearch([startInput, endInput], function() {
        _this._onAutoComplete();
      });
    },

    _restoreState: function(hashchange, oldUrl, newUrl) {
      var
        _this = this,
        routeStart = this.url.get('routeStart'),
        routeEnd = this.url.get('routeEnd');

      // always set input values from url
      this.$routeStartInput.val(routeStart);
      this.$routeEndInput.val(routeEnd);

      if (hashchange) {
        if (this.url.changed('routeStart', oldUrl, newUrl) || this.url.changed('routeEnd', oldUrl, newUrl)) {
          if (routeStart && routeEnd) {
            _loadRoute();
            this.$togglerBtn.addClass(this.togglerBtnActiveClass);
          } else {
            this.path = null;
            this.map.showMarkers(this.stationFinder.stationMarkers);
            this.directionsRenderer.setMap(null);
            this.$togglerBtn.removeClass(this.togglerBtnActiveClass);
          }

          this.stationFinder.filter._updateFilterInfo();
        }
      } else {
        _loadRoute();
      }

      function _loadRoute() {
        var triggerPlotRoute = true;
        // restore state of my location (add data attr to inputs)
        $.each([_this.$routeStartInput, _this.$routeEndInput], function() {
          if (this.val() === _this.myPosStr) {
            _this._addLatLngToInput(this, function() {
              _this.plotRoute({preserveViewport: true});
            });
            triggerPlotRoute = false;
          }
        });

        if (triggerPlotRoute) {
          _this.plotRoute({preserveViewport: true});
        }
      }
    },

    _updateUrl: function() {
      this.url.set('routeStart', this.$routeStartInput.val());
      this.url.set('routeEnd', this.$routeEndInput.val());
    },

    _addLatLngToInput: function($input, callback) {
      if (Modernizr.geolocation) {
        position.get(function(lat, lng) {
          $input.data('latlng', lat + ',' + lng);

          if (typeof callback === 'function') {
            callback();
          }
        });
      }
    },

    _onAutoComplete: function() {
      this.directionsRenderer.setMap(null);

      if (this.stationFinder.showOnlyFavorites) {
        this.stationFinder._removeShowOnlyFavorites();
      }

      this.plotRoute();
    },

    _onUpdate: function() {
      this._updateUrl();
      $(this).trigger('onupdate', [this.$routeStartInput.val(), this.$routeEndInput.val()]);

      this.$togglerBtn.addClass(this.togglerBtnActiveClass);

      Analytics.track({
        category: 'Hitta Station',
        action: 'Sök rutt',
        label: this.$routeStartInput.val() + ' - ' + this.$routeEndInput.val()
      });
    },

    _onClearRoute: function() {
      this.path = null;
      this.map.showMarkers(this.stationFinder.stationMarkers);
      this.directionsRenderer.setMap(null);
      this.$routeStartInput.add(this.$routeEndInput).val('');
      this._updateUrl();
      $(this).trigger('onclear');


      this.$togglerBtn.removeClass(this.togglerBtnActiveClass);

      Analytics.track({
        category: 'Hitta Station',
        action: 'Rensa rutt'
      });
    },

    _onFlipRoute: function() {
      var
        startVal = this.$routeStartInput.val(),
        endVal = this.$routeEndInput.val(),
        startLatLng = this.$routeStartInput.data('latlng'),
        endLatLng = this.$routeEndInput.data('latlng');

      // switch place of the values
      this.$routeStartInput.val(endVal);
      this.$routeEndInput.val(startVal);
      this.$routeStartInput.data('latlng', endLatLng);
      this.$routeEndInput.data('latlng', startLatLng);

      // clear the old directions
      this.directionsRenderer.setMap(null);

      // do the route, again
      this.plotRoute(this.$routeStartInput.get(0), this.$routeEndInput.get(0), this.routeBoxer, this.stationFinder.stationMarkers);

      this._updateUrl();

      Analytics.track({
        category: 'Hitta Station',
        action: 'Vänd rutt'
      });
    },

    _onMyLocationClick: function(e) {
      var
        _this = this,
        $input = $(e.currentTarget).parent().find('input'),
        $siblingInput = $input.siblings('input');

      $input.val(this.myPosStr);

      this._addLatLngToInput($input, function() {
        if ($siblingInput !== '') {
          _this.plotRoute();
        }
      });
    }
  };

  return StationFinderRoute;
});
