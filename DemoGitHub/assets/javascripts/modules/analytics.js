/*
 * Title: Analytics
 * Description: Handle analytics tracking
 *
 */


define('Analytics', ['jquery', 'helpers'], function($, helpers) {
  'use strict';

  var Analytics = {
    log: false,

    track: function(data) {
      if (this.isPresent()) {
        ga('send', 'event', data.category, data.action, data.label, data.value);
      } else {
        console.log('Track', data);
      }

      return this;
    },

    isPresent: function() {
      return typeof ga === 'function';
    },

    /***** Private *****/

    _init: function() {
      return this;
    }
  };

  Analytics._init();

  return Analytics;
});
