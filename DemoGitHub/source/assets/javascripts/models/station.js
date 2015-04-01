/*
 * Title: Station Model
 * Description: Model to handle the data and the connection to the Preem API
 *
 */


define('StationModel', ['jquery', 'Favorites'], function ($, Favorites) {
  'use strict';

  function StationModel(options) {
    this.options = $.extend({}, options);
    this.apiUrl = this.options.apiUrl;
    this.selectProps = [
      'Id',
      'Name',
      'Address',
      'PostalCode',
      'City',
      'PhoneNumber',
      'StationType',
      'StationSort',
      'OpeningHourWeekdayTime',
      'ClosingHourWeekdayTime',
      'OpeningHourSaturdayTime',
      'ClosingHourSaturdayTime',
      'OpeningHourSundayTime',
      'ClosingHourSundayTime',
      'CoordinateLatitude',
      'CoordinateLongitude',
      'Services/Name',
      'FuelTypes/Name',
      'FuelTypes/TextColor',
      'FuelTypes/BackgroundColor',
      'FuelTypes/BorderColor',
      'FuelTypes/Type',
      'FriendlyUrl',
      'CampaignImage',
      'TrailerRentalUrl'
    ];
    this.expandProps = ['FuelTypes', 'Services'];
  }

  StationModel.prototype = {
    get: function (params, success, type) {
      type = type || 'collection';

      var
        _this = this,
        query = typeof params === 'string' ? params : this._createApiQuery(params);

      $.ajax({
        url: this.apiUrl + query,
        success: function(data) {
          data = _this._modifyData(data);

          success.call(this, data);

          $(_this).trigger('onData', [data, type]);
        }
      });
    },

    getById: function(id, success) {
      var query = '?$filter=Id+eq+' + id + '&' + this._createSelectQuery() + '&' + this._createExpandQuery();
      this.get(query, success, 'single');
    },

    getByIds: function(ids, success) {
      var query = '?$filter=';

      if (ids.length) {
        $.each(ids, function(i, val) {
          var or = (i === 0) ? '' : '+or+';

          query += or+'Id+eq+'+this;
        });
      } else {
        query += 'null';
      }

      query += '&' + this._createSelectQuery() + '&' + this._createExpandQuery();

      this.get(query, success);
    },

    getMarkerImageData: function(station, isFavorite) {
      var data = {
        path: '/assets/images/map_markers/',
        width: 28,
        height: 39
      };

      if (isFavorite) {
        data.path += 'favorite.png';
        data.height = 26;
      } else if (station.StationSort === 'Såifa') {
        data.path += 'station_saifa.png';
      } else {
        data.path += 'station_default.png';
      }

      return data;
    },

    _createApiQuery: function(params) {
      var
        filter = '',
        secondPartParams = [],
        i = 0;

      // create the first part with the stationType and stationSort wrapped in brackets
      $.each(params, function() {
        if (this.name == 'StationType') {
          if (i > 0) {
            filter += '+or+';
          }

          filter += this.value;

          i++;
        } else {
          secondPartParams.push(this);
        }
      });

      // wrap the filter with brackets
      filter = filter ? '(' + filter + ')' : '';

      // add the second filter part
      $.each(secondPartParams, function() {
        var
          object = this.name.split('/')[0],
          property = this.name.split('/')[1];

        if (this.odatafilterexpression != '') {
          filter += '+and+' + this.odatafilterexpression;
        } else {
          filter += '+and+' + object + '/any(x: x/' + property + "+eq+'" + encodeURIComponent(this.value) + "')";
        }
      });

      filter = filter ? '?$filter=' + filter + '&' : '?';

      // put together the query
      return filter + this._createSelectQuery() + '&' + this._createExpandQuery();
    },

    _createSelectQuery: function() {
      return '$select=' + this.selectProps.join(',');
    },

    _createExpandQuery: function() {
      return '$expand=' + this.expandProps.join(',');
    },

    _modifyData: function(data) {
      var _this = this;

      // add some props to the data
      $.each(data, function(i, val) {
        this.favorite = Favorites.isFavorite(this.Id);
        this.isBemannad = this.StationType === 'Bemannad';

        if (this.StationSort === 'Extern') {
          this.StationSort = 'Såifa';
        }

        // Remove this is all the flags change!
        if (this.IsSaifa /*StationSort === 'Såifa'*/) {
          this.StationType = 'Såifa';
        }

        this.trailer = !!this.TrailerRentalUrl.length;

        this.openingHourText = _this._getOpeningHourText(this);
      });

      return data;
    },

    _getOpeningHourText: function(data) {
      var
        weekdayText = '',
        saturdayText = '',
        sundayText = '',
        text = '',

        weekdayHours = [
          data.OpeningHourWeekdayTime,
          data.ClosingHourWeekdayTime
        ],
        saturdayHours = [
          data.OpeningHourSaturdayTime,
          data.ClosingHourSaturdayTime
        ],
        sundayHours = [
          data.OpeningHourSundayTime,
          data.ClosingHourSundayTime
        ],
        hours = weekdayHours.concat(saturdayHours, sundayHours);

      function isZeroHour(element, index, array) {
        return element === '00:00';
      }

      if (hours.every(isZeroHour)) {
        text = 'Öppet dygnet runt';
      } else {
        weekdayText = weekdayHours[0] + '–' + weekdayHours[1];
        saturdayText = saturdayHours[0] + '–' + saturdayHours[1];
        sundayText = sundayHours[0] + '–' + sundayHours[1];

        text =
          'Vardagar ' + weekdayText + '<br>' +
          'Lördagar ' + saturdayText + '<br>' +
          'Söndagar och helgdagar ' + sundayText;
      }

      return text;
    }
  };

  return StationModel;
});
