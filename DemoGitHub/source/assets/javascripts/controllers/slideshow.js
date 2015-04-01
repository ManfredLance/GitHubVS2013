/*
 * Title: Slideshow
 * Description: Create and manage slideshow
 *
 */

define('slideshow', ['jquery', 'Analytics'], function ($, Analytics) {
  'use strict';

  var Slideshow = function($el, options) {
    this.options = $.extend({
      speed : 250,
      loop : false,
      duration : 0, // automatic transitions in milliseconds (0=manual)
      buttons : true, // add slideshow prev, next buttons
      pagination : true, // add a slide pagination
      transition : 'swipe' // Set type of transition animation: 'swipe', 'fade', 'both'
    }, options);
    this.$el = $el;
    this.$slider = this.$el.find('.js-Slideshow-slider');
    this.$list = this.$el.find('.Slideshow-list');
    this.$items = this.$el.find('.Slideshow-item');

    this.isMobile = window.outerWidth <= 500;
    this.loadingClass = 'Slideshow-slider--is-loading';
    this.currentPaginationItemClass = 'Slideshow-paginationItem--is-current';

    this.prevItemClass = 'Slideshow-item--is-prev';
    this.currentItemClass = 'Slideshow-item--is-current';
    this.nextItemClass = 'Slideshow-item--is-next';

    this.onFirstClass = 'Slideshow--onFirst';
    this.onLastClass = 'Slideshow--onLast';

    if(this.$items.length>1){
      this.setup();
    }
  };

  Slideshow.prototype = {
    setup: function() {
      var _this = this;

      if(this.options.pagination){
        this.$pagination = $('<div class="Slideshow-pagination"></div>');
        this.$paginationList = $('<ul class="Slideshow-paginationList"></ul>');
        this.$paginationItems = $('');
        this.$items.each(function(i, item){
          _this.$paginationItems = _this.$paginationItems.add($('<li class="Slideshow-paginationItem js-Slideshow-paginationItem"><button class="Slideshow-paginationItemButton">'+(i+1)+'</button></li>'));
        });
        this.$paginationList.append(this.$paginationItems);
        this.$pagination.append(this.$paginationList);
        this.$el.append(this.$pagination);

        this.setCurrentPaginationItem(0);
      }

      if(this.isMobile){
        this.options.transition = 'swipe';
      }
      if(this.options.loop && this.options.transition != 'fade'){
        this.$items.first().clone(true).appendTo(this.$list);
        this.$items.last().clone(true).prependTo(this.$list);
      }

      if(this.options.duration>0){
        this.run();
      }
      if(this.options.transition === 'fade'){
        this.$slider.addClass('Slideshow-slider--fading-only');
      }
      if(this.options.transition === 'both'){
        this.$slider.addClass('Slideshow-slider--fading');
      }

      this.setCurrentItem(0);

      this.$slider.touchslide({
        speed: this.options.speed,
        loop: this.options.loop,
        onBeforeSetWidth: function() {
          _this.onBeforeSetWidth();
        },
        onAfterSetWidth: function() {
          _this.onAfterSetWidth();
        },
        onSlideChange: function() {
          _this.onSlideChange(this.currentSlide);
        }
      });

      this.$prev = this.options.buttons ? $('<button class="Slideshow-btn Slideshow-btn--prev js-Slideshow-btn--prev u-icon-arrowleft"><span>Föregående</span></button>').prependTo(this.$el) : this.$el.find('.js-Slideshow-btn--prev');
      this.$next = this.options.buttons ? $('<button class="Slideshow-btn Slideshow-btn--next js-Slideshow-btn--next u-icon-arrowright"><span>Nästa</span></button>').appendTo(this.$el) : this.$el.find('.js-Slideshow-btn--next');
      this.eventListeners();
      this.touchslide = this.$slider.data('touchslide');
    },

    onBeforeSetWidth: function() {
      this.$slider.addClass(this.loadingClass);
    },

    onAfterSetWidth: function() {
      this.$slider.removeClass(this.loadingClass);
      if(this.options.loop){
        this.$list.css({'margin-left': -this.$items.last().width()+'px'});
      }
      if(this.options.duration>0 && this.isMobile){
        this.options.duration = 0;
        this.pause();
      }
    },

    onSlideChange: function(index) {
      this.setCurrentItem(index);
      this.setCurrentPaginationItem(index);
      this.setOnFirstOrLastClass(index);
      // Track only user interacted slides, not automatic
      if(!this.automaticSlide){
        Analytics.track({
          category: 'Slideshow',
          action: 'slide',
          label: 'To ' + (index + 1) + ' of ' + this.$items.length
        });
      }
      this.automaticSlide = false;
    },
    slideTo : function(index, animation){
      // calculate a realIndex based on the actual items if looping is active and there are clones out and about
      var realIndex = index < 0 ? this.$items.length-1 : index;
      realIndex = index >= this.$items.length ? 0 : index;
      this.setCurrentItem(realIndex);
      this.setCurrentPaginationItem(realIndex);

      this.touchslide.slideTo(index, animation);
    },
    eventListeners: function() {
      var _this = this;

      this.$prev.on('click', function() {
        _this.gotoPrev();
      });

      this.$next.on('click', function() {
        _this.gotoNext();
      });

      if(this.options.pagination){
        this.$paginationList.on('click', 'button', function(e) {
          e.preventDefault();
          var $target = $(e.target);

          // make all visible while panning to selected slide
          _this.$items.addClass(_this.nextItemClass);

          _this.onClickPagination($target.parent().index());
        });
      }
      // Pause interval on mouseover
      if(this.options.duration>0){
        this.$el.hover(function(){
          _this.pause();
        }, function(){
          _this.run();
        })
        .on('touchstart', $.proxy(this.pause, this))
        .on('touchend', $.proxy(this.run, this));

        $(window).on('focus', $.proxy(_this.run, _this)).on('blur', $.proxy(_this.pause, _this)).focus();
      }
    },
    // start interval
    run : function(){
      var _this = this;
      clearInterval(this.interval);
      if(this.options.duration>0){
        this.interval = setInterval(function(){
          _this.gotoNext(true);
        }, this.options.duration);
      }
    },
    // pause interval
    pause : function(){
      clearInterval(this.interval);
    },
    gotoPrev: function() {
      var prevSlide = this.touchslide.currentSlide - 1,
        $thisSlide, $prevSlide;
      $thisSlide = this.$items.eq(this.touchslide.currentSlide);

      // Get next slideitem-element
      if (prevSlide < 0 && this.options.loop) {
        $prevSlide = this.$items.eq(this.$items.length-1).add($thisSlide.prev());
        if(this.options.transition === 'fade'){
          prevSlide = this.$items.length-1;
        }
      } else {
        $prevSlide = this.$items.eq(prevSlide);
      }

      if (prevSlide >= 0 || this.options.loop) {
        $thisSlide.addClass(this.prevItemClass);
        $prevSlide.addClass(this.nextItemClass);
        this.slideTo(prevSlide, true);
      }
    },

    gotoNext: function(automatic) {
      var nextSlide = this.touchslide.currentSlide + 1,
          $thisSlide, $nextSlide;
      $thisSlide = this.$items.eq(this.touchslide.currentSlide);

      // Get next slideitem-element
      if (nextSlide >= this.$items.length && this.options.loop) {
        $nextSlide = this.$items.eq(0).add($thisSlide.next());
        if(this.options.transition === 'fade'){
          nextSlide = 0;
        }
      } else {
        $nextSlide = this.$items.eq(nextSlide);
      }
      if(automatic){
        this.automaticSlide = true;
      }
      if (nextSlide < this.$items.length || this.options.loop) {
        $thisSlide.addClass(this.prevItemClass);
        $nextSlide.addClass(this.nextItemClass);
        this.slideTo(nextSlide, true);
      }
    },

    onClickPagination: function(index) {
      this.slideTo(index, true);
    },

    setCurrentPaginationItem: function(index) {
      if(this.options.pagination) {
        this
          .$paginationItems
          .removeClass(this.currentPaginationItemClass)
          .eq(index)
          .addClass(this.currentPaginationItemClass);
      }
    },
    setCurrentItem: function(index) {
      this
        .$items
        .removeClass(this.currentItemClass+' '+this.nextItemClass+' '+this.prevItemClass)
        .eq(index)
        .addClass(this.currentItemClass);
    },

    setOnFirstOrLastClass: function(index) {
      this.$el.removeClass(this.onFirstClass + ' ' + this.onLastClass);

      if (index === 0 && !this.options.loop) {
        this.$el.addClass(this.onFirstClass);
      } else if (index === this.$items.length - 1 && !this.options.loop) {
        this.$el.addClass(this.onLastClass);
      } else if (index >= this.$items.length) { // Is index one step to far
        this.slideTo(0, false);
      } else if (index < 0) { // Is index one step to far
        this.slideTo(this.$items.length-1, false);
      }
    }
  };

  return {
    init: function ($el, options) {
      new Slideshow($el, options);
    }
  };
});
