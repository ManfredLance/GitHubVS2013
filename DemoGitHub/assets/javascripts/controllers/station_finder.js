/*
 * Title: Station finder
 * Description: Tool for finding Preem stations
 *
 */


define('stationFinder', ['jquery', 'helpers', 'googleMaps', 'Map', 'StationFinderList', 'Mustache', 'StationFinderRoute', 'StationModel', 'StationFinderFilter', 'StationFinderUrl', 'StationFinderStation', 'breakpoints', 'Favorites', 'Analytics', 'position'], function ($, helpers, googleMaps, Map, StationFinderList, Mustache, StationFinderRoute, StationModel, StationFinderFilter, StationFinderUrl, StationFinderStation, Breakpoints, Favorites, Analytics, position) {
  'use strict';

  var StationFinder = function($el, options) {
    this.$el = $el;
    this.options = $.extend({
      maxDistanceFromRoute: 10 // km
    }, options);

    // get user location as soon as possible
    position.get();

    this.$mapCanvas = $el.find('.js-Map-canvas');
    this.$search = $el.find('.StationFinder-search');
    this.$searchForm = $el.find('.js-StationFinder-searchForm');
    this.$searchInput = $el.find('.js-StationFinder-searchInput');
    this.$findMyPosition = $el.find('.js-StationFinder-findMyPositionBtn');
    this.$showFavoritesBtn = $el.find('.js-StationFinder-showFavoritesBtn');
    this.$favoritesInfo = $('.js-StationFinder-favoritesInfo');
    this.$favoritesInfoMsg = $('.js-StationFinder-favoritesInfoMsg');
    this.$list = $el.find('.js-StationFinder-list');
    this.$controls = $el.find('.js-StationFinder-controls');
    this.$loader = $('.js-StationFinder-loader');
    this.$loaderMsg =  $('.js-StationFinder-loaderMsg');
    this.$searchTogglerBtn = $('.StationFinder-showSearchBtn'); // TODO: add js-prefix-class to markup

    this.url = new StationFinderUrl();
    this.mapPosOnInit = false;
    this.mapOptions = this._getMapOptionsFromUrl();
    this.model = new StationModel({apiUrl: this.options.apiUrl});
    this.filter = new StationFinderFilter(this, this.options);
    this.map = new Map(this.$mapCanvas, this.mapOptions);
    this.route = new StationFinderRoute(this);
    this.list = new StationFinderList(this.$list, this);
    this.station = new StationFinderStation(this);

    this.stationMarkers = [];
    this.searchMarker = null;
    this.userLocationMarker = null;
    this.hasInteracted = false;
    this.showOnlyFavorites = false;
    this.requestOrigin = 'init';

    this.favoritesHasPosClass = 'StationFinder-showFavoritesBtn--has-position';
    this.myPosHasPosClass = 'StationFinder-findMyPositionBtn--has-position';
    this.favoriteSelector = '.js-StationItem-favorite';
    this.favoriteTextSelector = '.js-StationItem-favoriteText';
    this.actionBarIsFavoriteClass = 'ActionBar-action--favorite--is-favorite';
    this.stationItemIsFavoriteClass = 'StationItem--is-favorite';
    this.showFavoritesActiveClass = 'StationFinder-showFavoritesBtn--is-active';
    this.favoritesInfoActiveClass = 'StationFinder-favoritesInfo--is-active';
    this.loaderActiveClass = 'StationFinder-loader--is-active';
    this.searchTogglerBtnActiveClass = 'StationFinder-showSearchBtn--is-active';

    this._eventListeners();
    this._setupStationSearch();
    this._restoreState();
    this._addHeaderPadding();
  };

  StationFinder.prototype = {
    onFilterUpdate: function(params) {
      var
        _this = this,
        checkedInputsLabels = this.filter.getCheckedFilterLabels();

      params = params || this.filter.getParams();

      this.showLoader('Hämtar stationer');

      this.model.get(params, function(data) {
        _this.hideLoader();

        if (data.length === 0) {
          _this.filter.setText('Din filtrering gav inga resultat');
        }

        _this._updateMap(data);

        Analytics.track({
            category: 'Hitta Station Sökalternativ',
            action: 'Sök filtrerat',
          label: checkedInputsLabels.join(','),
          value: data.length
        });
      });
    },

    onFavoriteClick: function(e, data) {
      var
        $el = $(e.currentTarget),
        $text = $el.find(this.favoriteTextSelector),
        marker;

      if (Favorites.isFavorite(data.Id)) {
        Favorites.remove(data.Id);
        $el.parents('.StationItem').removeClass(this.stationItemIsFavoriteClass);
        $el.removeClass(this.actionBarIsFavoriteClass);
        $text.html($el.data('favorite-add-text'));
      } else {
        Favorites.add(data.Id);
        $el.parents('.StationItem').addClass(this.stationItemIsFavoriteClass);
        $el.addClass(this.actionBarIsFavoriteClass);
        $text.html($el.data('favorite-remove-text'));
      }

      marker = $.grep(this.stationMarkers, function(marker) {
        return marker.data.id === data.Id;
      })[0];

      marker.setIcon(this._getStationIcon(marker.data));
    },

    showLoader: function(msg) {
      var _this = this;

      msg = (msg || 'Laddar') + '...';

      _this.$loader.addClass(_this.loaderActiveClass);
      _this.$loaderMsg.html(msg);

      setTimeout(function () {
        _this.hideLoader();
      }, 10000);
    },

    hideLoader: function() {
      this.$loader.removeClass(this.loaderActiveClass);
    },

    _eventListeners: function() {
      var _this = this;

      this.$searchForm.on('submit', function(e) {
        var
          searchLatLngUrl = _this.url.get('searchLatLng'),
          searchLatLng = searchLatLngUrl ? searchLatLngUrl.split(',') : null;

        e.preventDefault();
        _this.$searchInput.blur();

        if (searchLatLng) {
          _this.map.panTo(searchLatLng[0], searchLatLng[1]);
        }
      });

      this.$searchInput.focus(function() {
        _this._onSearchInputFocus();
      }).blur(function() {
        _this._onSearchInputBlur();
      });

      $(this.filter).on('onsubmit', function(e, type) {
        if (_this.url.get('favorites') === 'true' && type === 'init') {
          _this._applyShowOnlyFavorites();
        } else {
          _this.onFilterUpdate();
          _this._removeShowOnlyFavoritesCosmetics();
        }
      });

      this.$findMyPosition.click(function() {
        _this._onFindMyPositionClick();
      });

      this.$showFavoritesBtn.click(function(e) {
        _this._onShowFavoritesBtnClick(e);
      });

      this.map.addListenerOnce('drag', function() {
        _this.hasInteracted = true;
      });

      google.maps.event.addListener(_this.map.map, 'dragend', function() {
        var center = _this.map.map.getCenter();

        // save zoom together with position to make the restore state change work
        // without going to strange places on the map
        _this.url.set({
          'mapPos': center.lat()+','+center.lng(),
          'mapZoom': _this.map.map.getZoom()
        });
      });

      google.maps.event.addListener(_this.map.map, 'zoom_changed', function() {
        // dont save default zoom level without map position
        if (_this.map.options.zoom != _this.map.map.getZoom() && _this.url.get('mapPos')) {
          _this.url.set('mapZoom', _this.map.map.getZoom());
        }
      });

      // bind only on the initial 'onData' event (to ensure markers exists)
      $(this.model).one('onData', function() {
        setTimeout(function() {
          _this._showUserLocation(_this.hasInteracted);
        }, 0);
      });

      $(this.list).on('openCloseChange', function(e, data) {
        _this._onListOpenCloseChange(data.isOpen);
      });

      $(window).on('debouncedresize', function() {
        _this._addHeaderPadding();
      }).on("pageshow", function(event) {
        if (event.originalEvent.persisted) {
          setTimeout(function() {
            _this.$searchInput.val(_this.url.get('search'));
          }, 0);
        }
      });

      this.url.setupChangeListener(this);
    },

    _updateMap: function(data) {
      this._removeStationMarkersFromMap();
      this._addStationsToMap(data);
    },

    _removeStationMarkersFromMap: function() {
      $.each(this.stationMarkers, function() {
        this.setMap(null);
      });
      this.stationMarkers = [];
    },

    _addStationsToMap: function(stations) {
      var _this = this;

      $.each(stations, function(i, station) {
        _this._addStationToMap(station);
      });

      // only fit map to markers if
      // not have map pos on init request
      // there is no a route plotted
      // not disabling favorites
      if ((this.requestOrigin === 'init' && this.mapPosOnInit) || this.route.path || this.requestOrigin === 'removeShowOnlyFavoritesClick') {
        // do not fit to markers
      } else {
        this.map.fitToMarkers(this.stationMarkers);
      }
    },

    _addStationToMap: function(station) {
      var
        _this = this,
        lat = station.CoordinateLatitude,
        lng = station.CoordinateLongitude,
        icon = this._getStationIcon(station),
        data = {
          id: station.Id,
          Id: station.Id,
          StationSort: station.StationSort
        },
        marker = this.map.addMarker(lat, lng, icon, 1, data, function() {
          _this._onClickStation(this);
        });

      this.stationMarkers.push(marker);
    },

    _getStationIcon: function(station) {
      var markerImageData = this.model.getMarkerImageData(station, Favorites.isFavorite(station.Id));

      return this.map.getMarkerImage(markerImageData);
    },

    _setupStationSearch: function() {
      var _this = this;

      _this.searchMarker = _this.map.addMarker(62.247179970970535, 17.69381999999996, '/assets/images/map_markers/search_position.png', 2);
      _this.searchMarker.setVisible(false);

      this.map.setupSearch(this.$searchInput.get(0), function() {
        var place = this.getPlace();
        if (place && place.geometry) {
          _this._onSearch(place.geometry.location);
        } else {
          _this._resetSearch();
        }
      });

      this.$searchInput.keydown(function(e) {
        if (_this.$searchInput.val() === '' && e.keyCode === 13) {
          _this._resetSearch();
        }
      });
    },

    _showUserLocation: function(interacted, force) {
      var _this = this;

      if (!Modernizr.geolocation) {
        return;
      }

      this.showLoader('Hämtar din position');

      this.map.getUserLocation(function(lat, lng, marker) {
        _this.hideLoader();

        _this.$showFavoritesBtn.addClass(_this.favoritesHasPosClass);
        _this.$findMyPosition.addClass(_this.myPosHasPosClass);

        if ((!interacted && !_this.mapPosOnInit) || force) {
          _this._showClosestMarkerFromUser(marker);
        }
      }, function() {
        _this.hideLoader();
      });
    },

    _showClosestMarkerFromUser: function(marker) {
      var
        markerPosition = marker.position,
        closestMarker = this.map.findClosestMarker(
          markerPosition,
          this.stationMarkers
        );

      this.userLocationMarker = marker;

      if (closestMarker) {
        this.map.showClosestMarker(
          markerPosition,
          closestMarker,
          this.stationMarkers
        );
      }
    },

    // show only favorites - override the original filter
    _applyShowOnlyFavorites: function() {
      this.showOnlyFavorites = true;
      this.url.set('favorites', true);
      this._applyShowOnlyFavoritesCosmetics();
      this._getFavoritesData();
    },

    _applyShowOnlyFavoritesCosmetics: function() {
      this.$favoritesInfo.addClass(this.favoritesInfoActiveClass);
      this.$showFavoritesBtn.addClass(this.showFavoritesActiveClass);
    },

    _getFavoritesData: function() {
      var _this = this;

      this.model.getByIds(Favorites.list, function(data) {
        var msg;

        _this._updateMap(data);

        if (data.length) {
          msg = 'Visar dina favoritstationer';
        } else {
          msg = 'Du har inte några favoritstationer';
        }

        _this.$favoritesInfoMsg.html(msg);
      });
    },

    _removeShowOnlyFavorites: function() {
      this.showOnlyFavorites = false;
      this.url.set('favorites', false);
      this._removeShowOnlyFavoritesCosmetics();
      this.onFilterUpdate();
    },

    _removeShowOnlyFavoritesCosmetics: function() {
      this.$favoritesInfo.removeClass(this.favoritesInfoActiveClass);
      this.$showFavoritesBtn.removeClass(this.showFavoritesActiveClass);
    },

    _addHeaderPadding: function() {
      var
        windowHeight = $(window).height(),
        headerHeight = $('.Header').height() || 0,
        mapMargin = parseInt(this.$controls.css('top'), 10),
        filterTop,
        filterPadding,
        filterMaxHeight,
        stationMaxHeight;

      this.$el.css('padding-top', headerHeight);

      if (Breakpoints.isAbove('small')) {
        filterTop = parseInt(this.filter.$el.css('top'), 10);
        filterPadding = parseInt(this.filter.$el.css('padding-bottom'), 10);
        filterMaxHeight = windowHeight - headerHeight - mapMargin - filterTop - filterPadding;
        stationMaxHeight = windowHeight - headerHeight - (mapMargin * 2);
      } else {
        filterMaxHeight = 'none';
        stationMaxHeight = 'none';
      }

      this.filter.$el.css('max-height', filterMaxHeight);
      this.station.$el.css('max-height', stationMaxHeight);
    },

    _getMapOptionsFromUrl: function() {
      var options = {};

      if (this.url.get('mapPos')) {
        this.mapPosOnInit = true;
      }

      if (this.url.get('mapPos')) {
        var
          lat = this.url.get('mapPos').split(',')[0],
          lng = this.url.get('mapPos').split(',')[1],
          latLng = new google.maps.LatLng(lat, lng);

        options.center = latLng;
      }

      if (this.url.get('mapZoom')) {
        options.zoom = Number(this.url.get('mapZoom'));
      }

      return options;
    },

    _resetSearch: function() {
      this.url.set('search', null);
      this.url.set('searchLatLng', null);

      // remove active state to tab
      this.$searchTogglerBtn.removeClass(this.searchTogglerBtnActiveClass);

      // reorder list sorting
      this.list.render();
    },

    _restoreState: function(hashchange, oldUrl, newUrl) {
      var
        _this = this,
        search = this.url.get('search'),
        searchLatLng = this.url.get('searchLatLng') ? this.url.get('searchLatLng').split(',') : null,
        favorites = this.url.get('favorites'),
        showClosest = this.url.get('showClosestToSearch'),
        mapPos = this.url.get('mapPos') ? this.url.get('mapPos').split(',') : null,
        mapZoom = this.url.get('mapZoom');

      if (hashchange) {
        if (this.url.changed('search', oldUrl, newUrl)) {
          this.$searchInput.val(search);
          if (search) {
            this.$searchTogglerBtn.addClass(this.searchTogglerBtnActiveClass);
          } else {
            this.$searchTogglerBtn.removeClass(this.searchTogglerBtnActiveClass);
          }
        }

        if (this.url.changed('searchLatLng', oldUrl, newUrl)) {
          this.list.render();
        }

        if (this.url.changed('favorites', oldUrl, newUrl)) {
          if (favorites === 'true') {
            this._applyShowOnlyFavorites();
          } else {
            this._removeShowOnlyFavorites();
          }
        }

        if (this.url.changed('mapPos', oldUrl, newUrl)) {
          if (mapPos) {
            this.map.panTo(mapPos[0], mapPos[1]);
          } else {
            this.map.map.panTo(_this.map.options.center);
          }
        }

        if (this.url.changed('mapZoom', oldUrl, newUrl)) {
          if (mapZoom) {
            this.map.map.setZoom(parseInt(mapZoom, 10));
          } else {
            this.map.map.setZoom(_this.map.options.zoom);
          }
        }

      } else {
        if (search) {
          this.$searchInput.val(search);
          this.$searchTogglerBtn.addClass(this.searchTogglerBtnActiveClass);
          $(_this.model).one('onData', function() {
            var latlng = new google.maps.LatLng(searchLatLng[0], searchLatLng[1]);

            if (showClosest === 'true') {
              var closestMarker = _this.map.findClosestMarker(latlng, _this.stationMarkers);
              _this.map.showClosestMarker(latlng, closestMarker);
              _this.hasInteracted = true;
              _this.url.set('showClosestToSearch', false);
            }
          });
        }
        if (favorites === 'true') {
          this.$showFavoritesBtn.addClass(this.showFavoritesActiveClass);
        }
      }

    },

    _onSearch: function(latlng) {
      var
        _this = this,
        closestMarker = this.map.findClosestMarker(latlng, this.stationMarkers);

      // add active state to toggler
      _this.$searchTogglerBtn.addClass(_this.searchTogglerBtnActiveClass);

      _this.map.showClosestMarker(latlng, closestMarker);

      _this.searchMarker.setPosition(latlng);
      _this.searchMarker.setVisible(true);


      // wait for fitBounds in showClosestMarker
      setTimeout(function() {
        var center = _this.map.map.getCenter();

        _this.url.set({
          'search': _this.$searchInput.val(),
          'searchLatLng': latlng.lat() + ',' + latlng.lng(),
          'mapPos': center.lat() + ',' + center.lng(),
          'mapZoom': _this.map.map.getZoom()
        });

        _this.list.render();
      }, 250);

      Analytics.track({
        category: 'Hitta Station',
        action: 'Sök Station',
        label: this.$searchInput.val()
      });
    },

    _onSearchInputFocus: function() {
      this.$search.addClass('StationFinder-search--has-focus');
    },

    _onSearchInputBlur: function() {
      this.$search.removeClass('StationFinder-search--has-focus');
    },

    _onClickStation: function(station) {
      this.station.load(station.data.id);
    },

    _onFindMyPositionClick: function() {
      this._showUserLocation(false, true);

      Analytics.track({
        category: 'Hitta Station',
        action: 'Visa position'
      });
    },

    _onShowFavoritesBtnClick: function(e) {
      var
        $btn = $(e.currentTarget),
        analyticsAction;
        /*
        Bytte från:
           analyticsAction = 'Hide favorites';

             analyticsAction = 'Show favorites';

                 category: 'Station finder',
        */
      if (this.showOnlyFavorites) {
        this._removeShowOnlyFavorites();
        analyticsAction = 'Dölj favoriter';
        this.requestOrigin = 'removeShowOnlyFavoritesClick';
      } else {
        this._applyShowOnlyFavorites();
        analyticsAction = 'Visa favoriter';
        this.requestOrigin = 'applyShowOnlyFavoritesClick';
      }

      Analytics.track({
        category: 'Hitta Station',
        action: analyticsAction
      });
    },

    _onListOpenCloseChange: function(isOpen) {
      var toggleClass = 'StationFinder--has-listOpen';

      if (isOpen) {
        this.$el.addClass(toggleClass);
      } else {
        this.$el.removeClass(toggleClass);
      }
    }
  };

  return {
    init: function ($el, options) {
      new StationFinder($el, options);
    }
  };
});
