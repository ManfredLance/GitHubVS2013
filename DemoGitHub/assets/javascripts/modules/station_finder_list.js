/*
 * Title: Station Finder List
 * Description: Handle the list
 *
 */


define('StationFinderList', ['jquery', 'Mustache', 'breakpoints', 'helpers', 'StationFinderFilter', 'StationFinderUrl', 'Favorites', 'position', 'Analytics'], function ($, Mustache, Breakpoints, helpers, StationFinderFilter, StationFinderUrl, Favorites, position, Analytics) {
  'use strict';

  function StationFinderList($el, stationFinder) {
    var _this = this;

    this.$el = $el;
    this.$toggler = $('.StationFinder-showListBtn');
    this.$secondaryToggler = $('.StationFinder-showListSecondaryBtn');

    this.stationFinder = stationFinder;
    this.model = stationFinder.model;
    this.filter = stationFinder.filter;
    this.route = stationFinder.route;
    this.map = stationFinder.map;
    this.template = $('#mustache-list').html();
    this.listItemExpandedTemplate = $('#mustache-station_item_expanded').html();
    this.data = null;
    this.url = stationFinder.url;
    this.listItemClass = 'StationItem';
    this.listItemExpandedSelector = '.StationItem-expanded';
    this.listItemExpandedClass = 'StationItem--is-expanded';
    this.showOnMapSelector = '.js-StationItem-showOnMap';

    this._bindEvents();
    this._restoreState();
  }

  StationFinderList.prototype = {
    render: function(data) {
      var
        _this = this,
        dataCountStr;

      // if no data is set in parameter: use the current data
      data = typeof data === 'undefined' ? this.data : data;

      // count the data once
      dataCountStr = ' (' + data.length + ' träff' + (data.length === 1 ? '' : 'ar') + ')';

      // Add distance from search
      if (this.url.get('searchLatLng')) {
        this._addDistanceFromSearchToData(data, onDistanceData);
      } else {
        this._addDistanceFromUserToData(data, onDistanceData, onDistanceError);
      }

      function onDistanceData(data, identifier) {
        if (identifier === 'search') {
          _this.headerStr = 'Sortering: Avstånd från ' + _this.url.get('search').split(',')[0] + dataCountStr;
        } else if (identifier === 'user') {
          _this.headerStr = 'Sortering: Avstånd från din position' + dataCountStr;
        }

        // only sort on distance if there is data with distance
        if (data.length && data[0].distance) {
          data = _this._sortListOnDistance(data);
        }

        render(data);
      }

      function onDistanceError(data) {
        // remove distance property from outdated data
        $.each(data, function() {
          delete this.distance;
        });

        data = _this._sortListAlphabetically(data);
        _this.headerStr = 'Sortering: Bokstavsordning' + dataCountStr;

        render(data);
      }

      function render() {
        var $listItem;

        _this.$el.html(Mustache.render(_this.template, {stations: data, header: _this.headerStr}));

        $listItem = _this.$el.find('.'+_this.listItemClass);

        $listItem.on('click', function(e) {
          var
            id = $(e.currentTarget).data('id'),
            result = $.grep(data, function(val) {
              return val.Id == id;
            });

          _this._onListItemClick(e, result[0]);
        });
      }
    },

    update: function() {
      var _this = this;
      this.model.get(this.filter.getParams(), function(data) {
        _this.data = data;
        _this.render(data);
      });
    },

    _restoreState: function(hashchange, oldUrl, newUrl) {
      var
        _this = this,
        listOpen = this.url.get('listOpen'),
        $toggler = Breakpoints.isAbove('small') ? _this.$secondaryToggler : _this.$toggler;

      if (hashchange) {
        if (this.url.changed('listOpen', oldUrl, newUrl)) {
          if (listOpen == 'true') {
            $toggler.data('controller').toggleOn();
          } else {
            $toggler.data('controller').toggleOff();
          }
        }
      } else {
        if (listOpen == 'true') {
          setTimeout(function() {
            $toggler.data('controller').toggleOn();
          }, 0);
        }
      }

      setTimeout(function() {
        _this._triggerListOpenChange(!!listOpen);
      }, 10);
    },

    _filterRouteData: function() {
      // if there is a route active - filter the data
      if (this.route.path) {
        var
          filtered = [],
          ids = this.route._getIdsInPath();

        filtered = $.grep(this.data, function(val) {
          var match = $.inArray(val.Id, ids) !== -1 ? true : false;

          return match;
        });

        return filtered;
      } else {
        return this.data;
      }
    },

    _addDistanceFromUserToData: function(data, success, error) {
      var
        _this = this,
        timeout = setTimeout(function() {
          _this._onNoLocation(error, data);
        }, 5000);

      if (Modernizr.geolocation) {
        if (position.lat && position.lng) {
          clearTimeout(timeout);

          _this._addDistanceToData([position.lat, position.lng], data, success, 'user');
        } else {
          $(position).on('position', function(e, userLat, userLng) {
            clearTimeout(timeout);

            _this._addDistanceToData([userLat, userLng], data, success, 'user');
          }).on('error', function() {
            clearTimeout(timeout);
            _this._onNoLocation(error, data);
          });
        }

      } else {
        _this._onNoLocation(error, data);
      }
    },

    _addDistanceFromSearchToData: function(data, callback) {
      var _this = this,
          searchLatLng = _this.url.get('searchLatLng');

      if (searchLatLng) {
        searchLatLng = searchLatLng.split(',');
        _this._addDistanceToData(searchLatLng, data, callback, 'search');
      }
    },

    _addDistanceToData: function(compareLatLng, data, callback, identifier) {
      $.each(data, function() {
        var
          lat = this.CoordinateLatitude,
          lng = this.CoordinateLongitude,
          distance = helpers.getDistanceBetweenPointsInWords(
            compareLatLng[0], compareLatLng[1], lat, lng
          );

        this.distance = distance;
      });

      if (typeof callback === 'function') {
        callback(data, identifier);
      }
    },

    _onNoLocation: function(callback, data) {
      if (typeof callback === 'function') {
        callback(data, true);
      }
    },

    _sortListOnDistance: function(data) {
      return data.sort(function(a, b) {
        return (parseFloat(a.distance) * 10) - (parseFloat(b.distance) * 10);
      });
    },

    _sortListAlphabetically: function(data) {
      return data.sort(function(a, b) {
        var
          x = a.Name.toLowerCase(),
          y = b.Name.toLowerCase();

        return x < y ? -1 : x > y ? 1 : 0;
      });
    },

    _bindEvents: function() {
      var _this = this;

      $(this.model).on('onData', function(e, data, type) {
        if (type == 'collection') {
          _this.data = data;

          if (!_this.stationFinder.showOnlyFavorites) {
            data = _this._filterRouteData();
          }

          _this.render(data);
        }
      });

      $(this.route).on('onupdate', function() {
        _this.render(_this._filterRouteData());
      });

      $(this.route).on('onclear', function() {
        _this.render(_this.data);
      });

      $(this.$toggler).add(this.$secondaryToggler).on('onToggleTrigger', function(e, isOn) {
        _this.url.set('listOpen', isOn);

        _this._triggerListOpenChange(isOn);

        Analytics.track({
          category: 'Hitta Station',
          action: isOn ? 'Visa lista' : 'Dölj lista'
        });
      });

      this.url.setupChangeListener(this);
    },

    _onListItemClick: function(e, data) {
      var
        _this = this,
        $el = $(e.currentTarget),
        $expandedEl = $el.find(this.listItemExpandedSelector),
        $showOnMap,
        $favorite,
        $moreInfo,
        $trailer;

      // render the template and then update the jquery el references
      $expandedEl.html(Mustache.render(this.listItemExpandedTemplate, data));

      // update the references
      $expandedEl = $el.find(this.listItemExpandedSelector);
      $showOnMap = $expandedEl.find(this.showOnMapSelector);
      $favorite = $expandedEl.find(this.stationFinder.favoriteSelector);
      $moreInfo = $expandedEl.find(this.stationFinder.station.moreInfoSelector);
      $trailer = $expandedEl.find(this.stationFinder.station.trailerSelector);

      // toggle expanded visibility
      $el.toggleClass(this.listItemExpandedClass);

      // bind the special cases
      $showOnMap.on('click', function(e) {
        _this._onShowOnMapClick(e, data);
      });

      $favorite.on('click', function(e) {
        _this.stationFinder.onFavoriteClick(e, data);
      });

      $moreInfo.on('click', function(e) {
        Analytics.track({
          category: 'Hitta Station',
          action: 'Visa mer information',
          label: data.Name
        });
      });
        /*
        Bytte från:
           category: 'Rental',
            action: 'Click',
        */
      $trailer.on('click', function(e) {
        Analytics.track({
          category: 'Uthyrning',
          action: 'Klickad',
          label: data.Name
        });
      });

      // stop the propagation to prevent the parent to trigger toggle visibility
      $expandedEl.find('a, button').on('click', function(e) {
        e.stopPropagation();
      });

      Analytics.track({
        category: 'Hitta Station',
        action: $el.hasClass(this.listItemExpandedClass) ? 'Visa station i lista' : 'Dölj station i lista'
      });
    },

    _onShowOnMapClick: function(e, data) {
      e.preventDefault();
      e.stopPropagation();

      this.map.panTo(data.CoordinateLatitude, data.CoordinateLongitude);
      this.map.map.setZoom(12);

      if (!Breakpoints.isAbove('small')) {
        this.$secondaryToggler.trigger('click');
      }

      Analytics.track({
        category: 'Hitta Station',
        action: 'Visa station på karta'
      });
    },

    _triggerListOpenChange: function(isOpen) {
      var data = {
        isOpen: isOpen
      };

      $(this).trigger('openCloseChange', data);
    }
  };

  return StationFinderList;
});
