/*
 * Title: Station finder url
 * Description: Module to handle the saving and retrieving of the url
 *
 */


define('StationFinderUrl', ['jquery'], function ($) {
  'use strict';

  function StationFinderUrl() {
    this.dontTriggerRestore = false;
  }

  StationFinderUrl.prototype = {
    set: function() {
      var params = this._getParams(),
          newParams = {};

      if (typeof arguments[0] === 'object') {
        newParams = arguments[0];
      } else {
        newParams[arguments[0]] = arguments[1];
      }

      $.each(newParams, function(k, v) {
        if (v) {
          params[k] = v;
        } else {
          delete params[k];
        }
      });

      this._setParams(params);
    },

    get: function(param) {
      var params = this._getParams();

      return params[param];
    },

    changed: function(param, oldUrl, newUrl) {
      return newUrl[param] != oldUrl[param];
    },

    setupChangeListener: function(obj) {
      var _this = this;

      $(window).on('hashchange', function(e) {

        if (!_this.dontTriggerRestore) {
          var
            oldUrl,
            newUrl;

          setTimeout(function() {
            // use oldURL/newURL for browsers supporting it
            if (e.originalEvent.oldURL && e.originalEvent.newURL) {
              oldUrl = $.unparam(e.originalEvent.oldURL.split('#')[1]);
              newUrl = $.unparam(e.originalEvent.newURL.split('#')[1]);
            } else {
              oldUrl = $.unparam(_this.lastUrl.replace('#', ''));
              newUrl = $.unparam(window.location.hash.replace('#', ''));
            }

            // call the obj._restoreState() method if it exists
            if (typeof obj['_restoreState'] === 'function') {
              obj['_restoreState'].apply(obj, [true, oldUrl, newUrl]);
            }
          }, 0);
        }

        setTimeout(function() {
          _this.lastUrl = window.location.hash;
        }, 100);

      });
    },

    _getParams: function(query) {
      query = (typeof query === 'undefined') ? window.location.hash : query;

      return $.unparam(query.replace('?', '').replace('#', ''));
    },

    _setParams: function(params) {
      var
        _this = this,
        query = $.param(params);

      this.dontTriggerRestore = true;

      window.location.hash = query;

      setTimeout(function() {
        _this.dontTriggerRestore = false;
      }, 0);
    }
  };

  return StationFinderUrl;
});
