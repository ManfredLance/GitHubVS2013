/*
 * Title: Main Nav
 * Description: Main navigation behaviour
 *
 */

define('mainNav', ['jquery', 'breakpoints', 'Analytics'], function ($, Breakpoints, Analytics) {
  'use strict';

  var MainNav = function($el, options) {
    this.$el = $el;
    this.$subMenuOpener = this.$el.find('.js-MainNav-linkOpener');
    this.$secondarySubMenuOpener = this.$el.find('.js-MainNav-link--opener');
    this.$toggleMenu = $('.js-menuToggler');
    this.$pusher = $('.js-u-pusher');

    this.isOpen = false;
    this.pusherSpeed = 300;
    this.openClass = 'MainNav-is-open';
    this.subLinkIsOpenClass = 'MainNav-link--opener-is-open';
    this.subLinkIsClosedClass = 'MainNav-link--opener-is-closed';

    this.eventListeners();
  };

  MainNav.prototype = {
    eventListeners: function() {
      var _this = this;

      this.$subMenuOpener.click(function(e) {
        _this.onSubMenuOpenerClick(e, $(this).closest('a'));
      });

      this.$secondarySubMenuOpener.click(function(e) {
        _this.onSubMenuOpenerClick(e, $(this));
      });

      this.$toggleMenu.on('onToggleTrigger', function(e, isOpen, togglerEvent) {
        togglerEvent.stopPropagation();
        _this.onToggleMenu(isOpen);
      });
    },

    onSubMenuOpenerClick: function(e, $el) {
      var
        isBetweenZeroToSmall = Breakpoints.isBetween('zero-to-small'),
        isSecondaryOpener = $el.hasClass('MainNav-secondaryNavLink--opener');

      if (isBetweenZeroToSmall || isSecondaryOpener) {
        e.preventDefault();

        if ($el.hasClass(this.subLinkIsOpenClass)) {
          this.closeSub($el);
        } else {
          this.openSub($el);
        }
      }
    },

    onToggleMenu: function(isOpen) {
      var _this = this;

      if (isOpen) {
        this.$el.addClass(this.openClass);
        _this.bindDocumentClick();
        Analytics.track({
          category: 'Navigation',
          action: 'Visa'
        });
      } else {
        _this.unbindDocumentClick();
        _this.removeOpenClassAfterPush();
        Analytics.track({
          category: 'Navigation',
          action: 'Göm'
        });
      }
    },

    openSub: function($el) {
      $el
        .addClass(this.subLinkIsOpenClass)
        .removeClass(this.subLinkIsClosedClass)
        .siblings()
        .addClass('MainNav-list--sub-is-open')
        .removeClass('MainNav-list--sub-is-closed');

      if (Breakpoints.isAbove('small')) {
        this.bindSubClose($el);
      }
    },

    closeSub: function($el, index) {
      $el
        .addClass(this.subLinkIsClosedClass)
        .removeClass(this.subLinkIsOpenClass)
        .siblings()
        .addClass('MainNav-list--sub-is-closed')
        .removeClass('MainNav-list--sub-is-open');

      this.unbindSubClose(index);
    },

    bindSubClose: function($el) {
      var
        _this = this,
        $parent = $el.parent(),
        index = $parent.index();

      $(document).on('click.mainNav--sub' + index, function(e) {
        var isClickOutside = $parent.has(e.target).length === 0;

        if (isClickOutside) {
          _this.closeSub($el, index);
        }
      });
    },

    unbindSubClose: function(index) {
      $(document).off('click.mainNav--sub' + index);
    },

    bindDocumentClick: function() {
      var _this = this;

      $(document).on('touchstart.MainNav', function(e) {
        var
          $target = $(e.target),
          targetIsMainNav = $target.hasClass('MainNav'),
          targetInMainNav = !!$target.closest('.MainNav').length,
          targetIsToggler = $target.hasClass('js-menuToggler'),
          targetInToggler = !!$target.closest('.js-menuToggler').length;

        if (!targetIsMainNav && !targetInMainNav && !targetIsToggler && !targetInToggler) {
          e.preventDefault();
          _this.closeMenu();
          _this.unbindDocumentClick();
        }
      });
    },

    unbindDocumentClick: function() {
      $(document).off('touchstart.MainNav');
    },

    closeMenu: function() {
      this.$pusher.removeClass('u-pusher--is-pushed');
      this.removeOpenClassAfterPush();
      Analytics.track({
        category: 'Navigation',
        action: 'Göm'
      });
    },

    removeOpenClassAfterPush: function() {
      var _this = this;

      setTimeout(function() {
        _this.$el.removeClass(_this.openClass);
      }, this.pusherSpeed);
    }
  };

  return {
    init: function ($el, options) {
      new MainNav($el, options);
    }
  };
});
