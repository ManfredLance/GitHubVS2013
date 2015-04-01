/*
 * Title: Station Finder Station
 * Description: Module to handle the single station
 *
 */

define('StationFinderStation', ['jquery', 'helpers', 'Mustache', 'StationFinderUrl', 'Favorites', 'breakpoints', 'Analytics'], function ($, helpers, Mustache, StationFinderUrl, Favorites, Breakpoints, Analytics) {
  'use strict';

  function StationFinderStation(stationFinder) {
    this.stationFinder = stationFinder;

    this.$el = stationFinder.$el.find('.js-StationItem--map');
    this.$distance = null;
    this.$distanceContainer = null;
    this.$closeBtn = null;
    this.$favoriteBtn = null;
    this.$directionsLink = null;
    this.$moreInfo = null;

    this.template = $('#mustache-station_mini').html();
    this.activeClass = 'StationItem--is-active';
    this.expandedClass = 'StationItem--map--is-expanded';
    this.distanceSelector = '.js-StationItem-distance';
    this.distanceContainerSelector = '.js-StationItem-distanceContainer';
    this.hasDistanceClass = 'StationItem-distanceContainer--has-distance';
    this.closeBtnSelector = '.js-StationItem-closeBtn';
    this.directionsLinkSelector = '.js-StationItem-directions';
    this.moreInfoSelector = '.js-StationItem-moreInfo';
    this.trailerSelector = '.js-StationItem-trailer';

    this.isExpanded = false;

    this.url = stationFinder.url;
    this.model = stationFinder.model;

    this._bindEvents();
    this._parseTemplate();
    this._restoreState();
  }

  StationFinderStation.prototype = {
    load: function(id) {
      var
        _this = this,
        nameParts;

      this.model.getById(id, function(data) {
        data = data[0];
        nameParts = data.Name.split(',');

        data.favorite = Favorites.isFavorite(data.Id);
        data.isBemannad = data.StationType === 'Bemannad';
        data.nameCity = $.trim(nameParts[0]);
        data.nameLocation = $.trim(nameParts[1]);

        _this.url.set('openStation', id);

        _this.render(data);
        _this.$el.addClass(_this.activeClass);
        _this.$distance = _this.$el.find(_this.distanceSelector);
        _this.$distanceContainer = _this.$el.find(_this.distanceContainerSelector);
        _this.$closeBtn = _this.$el.find(_this.closeBtnSelector);
        _this.$favoriteBtn = _this.$el.find(_this.stationFinder.favoriteSelector);
        _this.$directionsLink = _this.$el.find(_this.directionsLinkSelector);
        _this.$moreInfo = _this.$el.find(_this.moreInfoSelector);
        _this.$trailer = _this.$el.find(_this.trailerSelector);

        if (data.favorite) {
          _this.$el.addClass(_this.stationFinder.stationItemIsFavoriteClass);
        } else {
          _this.$el.removeClass(_this.stationFinder.stationItemIsFavoriteClass);
        }

        helpers.getDistanceFromUser(
          data.CoordinateLatitude,
          data.CoordinateLongitude,
          function(distance) {
            _this.$distance.html(distance);
            _this.$distanceContainer.addClass(_this.hasDistanceClass);
          }
        );

        _this.$el.find('a, button').on('click', function(e) {
          e.stopPropagation();
        });

        _this.$closeBtn.on('click', function(e) {
          _this._onClickCloseBtn(e);
        });

        _this.$favoriteBtn.on('click', function(e) {
          _this.stationFinder.onFavoriteClick(e, data);
        });

        _this.$directionsLink.on('click', function(e) {
          Analytics.track({
            category: 'Hitta Station',
            action: 'Rutt',
            label: data.Name
          });
        });

        _this.$moreInfo.on('click', function(e) {
          Analytics.track({
            category: 'Hitta Station',
            action: 'Visa mer information',
            label: data.Name
          });
        });
          /*
          Före:
             category: 'Rental',
            action: 'Click',
          */
        _this.$trailer.on('click', function(e) {
          Analytics.track({
            category: 'Uthyrning',
            action: 'Klickad',
            label: data.Name
          });
        });

        Analytics.track({
          category: 'Hitta Station',
          action: 'Öppna station kartikon',
          label: data.Name
        });
      });
    },

    render: function(data) {
      var html = Mustache.render(this.template, data);

      this.$el.html(html);
    },

    hide: function() {
      this.$el
        .removeClass(this.activeClass)
        .removeClass(this.expandedClass);

      this.isExpanded = false;
      this.url.set('openStation', null);

      Analytics.track({
        category: 'Hitta Station',
        action: 'Stäng station kartikon',
        label: this.$el.find('.StationItem-header').text()
      });
    },

    _parseTemplate: function() {
      Mustache.parse(this.template);
    },

    _restoreState: function(hashchange, oldUrl, newUrl) {
      var stationId = this.url.get('openStation');

      if (hashchange) {
        if (this.url.changed('openStation', oldUrl, newUrl)) {
          if (stationId) {
            this.load(stationId);
          } else {
            this.hide();
          }
        }
      } else {
        if (stationId) {
          this.load(stationId);
        }
      }

    },

    _bindEvents: function() {
      var _this = this;

      if (Modernizr.touch) {
        this.$el.on('touchstart', function(e) {
          _this._onTouchstart(e);
        });
      } else {
        this.$el.click(function(e) {
          _this._onClick(e);
        });
      }

      this.url.setupChangeListener(this);
    },

    _onClick: function(e) {
      if (!Breakpoints.isAbove('small')) {
        this.$el.addClass(this.expandedClass);
        this.isExpanded = true;
      }
    },

    _onTouchstart: function(e) {
      var
        isCompact = !this.isExpanded,
        isBelowSmall = Breakpoints.isBetween('zero-to-small'),
        isCloseButton = $(e.target).hasClass('js-StationItem-closeBtn');

      if (isCompact && isBelowSmall && !isCloseButton) {
        e.stopPropagation();
        e.preventDefault();
        this.$el.addClass(this.expandedClass);
        this.isExpanded = true;
      }
    },

    _onClickCloseBtn: function(e) {
      e.stopPropagation();

      this.hide();
    }
  };

  return StationFinderStation;
});
