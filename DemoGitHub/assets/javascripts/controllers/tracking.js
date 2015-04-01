/*
 * Title: Tracking
 * Description: Controller for basic link tracking
 *
 */


define('tracking', ['jquery', 'Analytics'], function ($, Analytics) {
  'use strict';

  var Tracking = function($el, options) {
    this.$el = $el;
    this.trackLinkSelector = 'a.js-trackLink, .js-trackLink a';
    this.eventListeners();
  };

  Tracking.prototype = {
    eventListeners: function() {
      var _this = this;

      $(document).on('click', this.trackLinkSelector, function(e) {
        _this.onTrackLinkClick($(this), e);
      });
    },

    onTrackLinkClick: function($el, e) {
      var data;

      if ($el.hasClass('js-trackLink')) {
        data = $el.data();
      } else {
        data = $el.closest('.js-trackLink').data();
      }

      this.trackLink($el, data);
    },

    trackLink: function($el, data) {
      var
        href = $el.attr('href'),
        trackData = {
          category: data.trackingCategory,
          action: data.trackingAction || 'Click',
          label: data.trackingLabel || $el.attr('title') || $.trim($el.text())
        };

      Analytics.track(trackData);
    }
  };

  return {
    init: function ($el, options) {
      new Tracking($el, options);
    }
  };
});
