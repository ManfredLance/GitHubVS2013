/*
 * Title: Station filter
 * Description: Module to handle the filter
 *
 */



define('StationFinderFilter', ['jquery', 'helpers', 'breakpoints', 'Mustache', 'StationFinderUrl', 'Analytics'], function ($, helpers, Breakpoints, Mustache, StationFinderUrl, Analytics) {
  'use strict';

  function StationFinderFilter(stationFinder, options) {
    var _this = this;

    this.$el = stationFinder.$el.find('.js-StationFinder-filter');
    this.$inputs = $();
    this.$filterInfo = $('.js-StationFinder-filterInfo');
    this.$filterInfoMsg = $('.js-StationFinder-filterInfoMsg');
    this.$submitBtn = $('.js-StationFinder-filter-submit-btn');
    this.$closeBtn = $('.js-StationFinder-filter-closeBtn');
    this.$togglerBtn = $('.StationFinder-showFilterBtn');
    this.$typeInputs = $('.js-StationFinder-filter-types').find('input');
    this.$services = $('.js-StationFinder-filter-services');
    this.$fuelTypes = $('.js-StationFinder-filter-fuelTypes');

    this.stationFinder = stationFinder;
    this.defaultFilters = ['station-type-manned', 'station-type-unmanned', 'station-sort-saifa'];
    this.queryVar = 'filters';
    this.url = stationFinder.url;
    this.filtersTemplate = $('#mustache-filters').html();
    this.filters = [
      {el: this.$services, url: options.servicesApiUrl, name: 'Services/Name'},
      {el: this.$fuelTypes, url: options.fuelTypesApiUrl, name: 'FuelTypes/Name'}
    ];
    this.togglerBtnActiveClass = 'StationFinder-showFilterBtn--is-active';
    this.filterInfoActiveClass = 'StationFinder-filterInfo--is-active';
    this._getFilters();
    this._bindEvents();
  }

  StationFinderFilter.prototype = {
      getParams: function () {

        var params = [];
        if (this.$inputs !== undefined) {
          this.$inputs.each(function () {
            if ($(this).is(':checked')) {
              params.push({
                id: $(this).attr('id'),
                name: $(this).attr('name'),
                value: $(this).val(),
                odatafilterexpression: $(this).data('odatafilterexpression')
              });
            }
          });
        }
        return params;
    },

    // set filters in DOM
    setFilters: function(filters) {
      filters = filters || this._getUrlFilters();

      this.$inputs.each(function() {
        $(this).prop('checked', false);
      });

      $.each(filters, function() {
        $('#'+this).prop('checked', true);
      });
    },

    setText: function(text) {
      this._showFilterMsg(text);
    },

    getCheckedFilterLabels: function() {
      return $.map(this._getCheckedFilters(), function(value) {
        return $('label[for='+value.id+']').text();
      });
    },

    _formatFilterInfoText: function(list) {
      var str = '';

      switch (true) {
        case list.length == 2:
          str = list.join(' och ');
          break;
        case list.length > 2:
          str = list.join(', ');
          str = str.replace(/,([^,]*)$/, ' och $1');
          break;
        default:
          str = list.join(', ');
      }

      return str.toLowerCase().replace('såifa', 'Såifa');
    },

    _updateFilterInfo: function() {
      var
        checkedFilterIds = this._getCheckedFilterIds().sort().join(','),
        defaultFilterIds = this.defaultFilters.sort().join(','),
        isDefaultFilters = checkedFilterIds === defaultFilterIds,
        filterMsg;

      if (isDefaultFilters && !this.stationFinder.route.path) {
        this._hideFilterMsg();
      } else {
        filterMsg = this._getFilterMsg();
        this._showFilterMsg(filterMsg);
      }

      if (isDefaultFilters) {
        this.$togglerBtn.removeClass(this.togglerBtnActiveClass);
      } else {
        this.$togglerBtn.addClass(this.togglerBtnActiveClass);
      }
    },

    _showFilterMsg: function(text) {
      this.$filterInfo.addClass(this.filterInfoActiveClass);
      this.$filterInfoMsg.html(text);
    },

    _hideFilterMsg: function() {
      this.$filterInfo.removeClass(this.filterInfoActiveClass);
      this.$filterInfoMsg.html('');
    },

    _getFilterMsg: function() {
      var
        checkedFilters = this._getCheckedFilters(),
        text,
        routePart = '',
        firstPart,
        secondPart;

      if (this.stationFinder.route.path) {
        routePart = ' stationer inom sökt rutt med ';
      }

      firstPart = $.grep(checkedFilters, function(value) {
        return value.name == 'StationType';
      }).map(function(value) {
        return $('label[for=' + value.id + ']').html();
      });

      secondPart = $.grep(checkedFilters, function(value) {
        return value.name == 'Services/Name' || value.name == 'FuelTypes/Name';
      }).map(function(value) {
        return value.value;
      });

      text = 'Visar ' + routePart + this._formatFilterInfoText(firstPart) + ' ';

      if (secondPart.length) {
        text += ' som har ' + this._formatFilterInfoText(secondPart);
      }

      return text;
    },

    // get the filters from url
    _getUrlFilters: function() {
      var filters = this.url.get(this.queryVar);

      return filters ? filters.split(',') : [];
    },

    // get the checked filters from DOM
    _getCheckedFilters: function() {
      var filters = [];
      this.$inputs.each(function() {
        if (this.checked) {
          filters.push(this);
        }
      });
      return filters;
    },

    _getCheckedFilterIds: function() {
      return $.map(this._getCheckedFilters(), function(value) {
        return value.id;
      });
    },

    // update url with params
    _updateUrl: function(params) {
      var checkedFilterIds = this._getCheckedFilterIds();

      this.url.set(this.queryVar, checkedFilterIds.join(','));
    },

    _restoreState: function(hashchange, oldUrl, newUrl) {
      var
        _this = this,
        filters = this._getUrlFilters();

      if (hashchange) {
        if (this.url.changed(this.queryVar, oldUrl, newUrl)) {
          this.setFilters(filters.length ? filters : this.defaultFilters);
          $(this).trigger('onsubmit', ['click']);
          _this._updateFilterInfo();
        }
      } else {
        this.setFilters(filters.length ? filters : this.defaultFilters);
      }
    },

    _getFilters: function() {
      var
        _this = this,
        i = 0;

      $.each(this.filters, function() {
        var
          obj = this,
          data = [];

        $.get(obj.url, function(response) {
            $.each(response, function (value) {
                //console.log('ODataFilterExpression for ' + this.Name, this.ODataFilterExpression);

              data.push({
                  'id': 'f-' + i + '-' + this.Id,
                  'value': this.Name,
                  'name': obj.name,
                  'odatafilterexpression': this.ODataFilterExpression
              });
          });

          _this._renderFilters(obj.el, data);

          if (i === _this.filters.length - 1) {
            $(_this).trigger('filtersrendered');
          }

          i++;
        });
      });
    },

    _renderFilters: function(el, data) {
      el.html(Mustache.render(this.filtersTemplate, {filters: data}));
    },

    _bindEvents: function() {
      var _this = this;

      this.$submitBtn.click(function(e) {
        _this._onSubmitClick();
      });

      this.$closeBtn.click(function(e) {
        _this.$togglerBtn.trigger('click');
      });

      $(this).on('filtersrendered', function() {
        _this.$inputs = _this.$el.find('input');
        _this.$inputs.change(function(e) {
          _this._onInputChange(e, this);
        });
        _this._restoreState();
        _this._updateFilterInfo();
        $(_this).trigger('onsubmit', ['init']);
      });

      this.$typeInputs.change(function() {
        _this._onTypeChange();
      });

      setTimeout(function() {
        $(_this.stationFinder.route).on('plotroute onclear', function() {
          _this._updateFilterInfo();
        });
      }, 0);

      this.url.setupChangeListener(this);
    },

    _onInputChange: function(e, input) {
      var $label;

      if (input.checked) {
        $label = $('label[for='+input.id+']');

        Analytics.track({
            category: 'Hitta Station Sökalternativ',
          action: 'Filtrerad med',
          label: $label.text()
        });
      }
    },

    _onTypeChange: function() {
      if (this.$typeInputs.filter(':checked').length === 0) {
        this.$typeInputs.prop('checked', true);
      }
    },

    _onSubmitClick: function(e) {
      this.stationFinder.requestOrigin = 'filterClick';
      $(this).trigger('onsubmit', ['click']);
      this._updateUrl();
      this._updateFilterInfo();

      if (!Breakpoints.isAbove('small')) {
        this.$closeBtn.trigger('click');
      }
    }
  };

  return StationFinderFilter;
});
