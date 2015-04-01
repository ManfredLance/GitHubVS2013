/*
 * Title: Accept Cookies
 * Description: Let user agree that the site uses cookies.
 *
 */

define('acceptCookies', ['jquery', 'helpers'], function ($, helpers) {
  'use strict';

  var AcceptCookies = function($el, options) {
    this.$el = $el;
    this.$accept = $el.find('.js-AcceptCookies-acceptBtn');
    this.cookieName = 'acceptCookies';

    this.hasAccepted = helpers.cookies.read(this.cookieName) === 'true';
    this.openClass = 'AcceptCookies--is-open';

    if (!this.hasAccepted) {
      this.show();
      this.eventListeners();
    }
  };

  AcceptCookies.prototype = {
    eventListeners: function() {
      var _this = this;

      this.$accept.click(function(e) {
        _this.accept();
      });
    },

    show: function() {
      this.$el.addClass(this.openClass);
    },

    hide: function() {
      this.$el.removeClass(this.openClass);
    },

    accept: function() {
      helpers.cookies.create(this.cookieName, 'true', 365);
      this.hide();
    }
  };

  return {
    init: function ($el, options) {
      new AcceptCookies($el, options);
    }
  };
});
