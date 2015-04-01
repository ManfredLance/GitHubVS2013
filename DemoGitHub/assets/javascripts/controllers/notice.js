/*
 * Title: Notice
 * Description: Let use close a notice and never see it again
 *
 */


define('notice', ['jquery', 'helpers'], function ($, helpers) {
  'use strict';

  var Notice = function($el, options) {
    this.$el = $el;
    this.$closeBtn = this.$el.find('.js-Notice-close');

    this.cookieName = 'closed_notices';
    this.id = options.id;

    this.eventListeners();
  };

  Notice.prototype = {
    eventListeners: function() {
      var _this = this;

      this.$closeBtn.click(function(e) {
        e.preventDefault();

        _this.onClose();
      });
    },

    onClose: function() {
      this.hide();
      this.saveNoticeId();
    },

    hide: function() {
      this.$el.slideUp(200);
    },

    saveNoticeId: function() {
      var notices = this.getNoticeIds();

      if ($.inArray(this.id, notices) === -1) {
        notices.push(this.id);
        helpers.cookies.create(this.cookieName, JSON.stringify(notices), 365);
      }
    },

    getNoticeIds: function() {
      var data = helpers.cookies.read(this.cookieName) || '[]';

      return JSON.parse(data);
    }
  };
window.helpers = helpers;
  return {
    init: function ($el, options) {
      new Notice($el, options);
    }
  };
});
