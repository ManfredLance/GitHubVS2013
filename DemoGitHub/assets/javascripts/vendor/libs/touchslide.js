/*jslint browser: true, nomen: true, indent: 2, maxlen: 80 */
/*global DocumentTouch: false */

// touchslide.js | (c) Fred Bergman | MIT Licence

(function (win, doc) {

  'use strict';

  var touchslide = function (el, options) {
    this.options = {
      speed: 250,
      loop: false,
      onAfterSlide: function () { return; },
      onSlideChange: function () { return; },
      onBeforeSetWidth: function () { return; },
      onAfterSetWidth: function () { return; }
    };
    this.mergeOptions(options);
    this.el = el;
    this.list = el.children[0];
    this.slides = this.getSlides();
    this.slideWidth = this.getSlideWidth();
    this.x = 0;
    this.start = {
      x: 0,
      y: 0,
      t: 0
    };
    this.delta = {
      x: 0,
      y: 0
    };
    this.currentSlide = 0;
    this.isVerticalScroll = null;
    this.vendorPrefixes = ['Webkit', 'Moz', 'O', 'ms'];
    this.supports = {
      msPointerEvents: !!win.navigator.msPointerEnabled,
      touch:
        typeof win.ontouchstart === 'object' ||
        (win.DocumentTouch && doc instanceof DocumentTouch),
      transitions: (function () {
        var s = doc.createElement('p').style;
        return (
          s.hasOwnProperty && (
            s.hasOwnProperty('transition') ||
            s.hasOwnProperty('WebkitTransition') ||
            s.hasOwnProperty('MozTransition') ||
            s.hasOwnProperty('msTransition') ||
            s.hasOwnProperty('OTransition')
          )
        );
      }())
    };
    this.setWidths();
    this.setupEventListeners();
  };

  touchslide.prototype = {
    getSlides: function () {
      return this.list.children;
    },

    getSlideWidth: function () {
      return Math.round(
        this.el.getBoundingClientRect().width || this.el.offsetWidth
      );
    },

    setWidths: function () {
      this.options.onBeforeSetWidth.call(this);

      this.setListWidth();
      this.setListItemWidth();

      this.options.onAfterSetWidth.call(this);

      return this;
    },

    setListWidth: function () {
      this.list.style.width = this.slideWidth * this.slides.length + 'px';

      return this;
    },

    setListItemWidth: function () {
      var
        _this = this,
        width = this.slideWidth + 'px',
        i;

      for (i = 0; i < this.slides.length; i = i + 1) {
        _this.slides[i].style.width = width;
      }

      return this;
    },

    setupEventListeners: function () {
      var _this = this;

      if (doc.addEventListener) {

        if (this.supports.msPointerEvents) {
          this.list.addEventListener('MSPointerDown', function (e) {
            _this.onTouchStart(e);
          }, false);
          this.list.addEventListener('MSPointerMove', function (e) {
            _this.onTouchMove(e);
          }, false);
          this.list.addEventListener('MSPointerUp', function (e) {
            _this.onTouchEnd(e);
          }, false);
        } else if (this.supports.touch) {
          this.list.addEventListener('touchstart', function (e) {
            _this.onTouchStart(e);
          }, false);

          this.list.addEventListener('touchmove', function (e) {
            _this.onTouchMove(e);
          }, false);

          this.list.addEventListener('touchend', function (e) {
            _this.onTouchEnd(e);
          }, false);
        }

        win.addEventListener('resize', function () {
          _this.onWindowResize();
        }, false);
      } else if (doc.attachEvent) {
        win.attachEvent('onresize', function () {
          _this.onWindowResize();
        });
      }
    },

    onTouchStart: function (e) {
      var
        x,
        y;

      if (!!e.touches) {
        x = e.touches[0].pageX;
        y = e.touches[0].pageY;
      } else {
        x = e.clientX;
        y = e.clientY;
      }

      this.isVerticalScroll = null;

      this.start = {
        x: x,
        y: y,
        t: +new Date()
      };

      this.delta = {
        x: 0,
        y: 0
      };
    },

    onTouchMove: function (e) {
      var
        translateX,
        halfDist,
        ratio,
        factor,
        widthBefore = this.slideWidth * this.currentSlide,
        x,
        y;

      if (!!e.touches) {
        x = e.touches[0].pageX;
        y = e.touches[0].pageY;
      } else {
        x = e.clientX;
        y = e.clientY;
      }

      this.delta = {
        x: x - this.start.x,
        y: y - this.start.y
      };

      if (this.isVerticalScroll === null) {
        this.isVerticalScroll = this.getIsVerticalScroll();
      }

      if (!this.isVerticalScroll) {
        e.preventDefault();

        translateX = this.delta.x + this.x;
        if(!this.options.loop){
          if (this.isFirstSlideSlidingLeft()) {
            halfDist = this.slideWidth / 2;
            ratio = translateX / halfDist;
            factor = 1 / (ratio + 1);
            translateX = translateX * factor;
          } else if (this.isLastSlideSlidingRight()) {
            halfDist = -(this.slideWidth / 2);
            ratio = translateX / halfDist;
            factor = 1 / (ratio + 1);

            translateX = ((translateX - this.x) * factor) - widthBefore;
          }
        }

        this.setSlidePos(Math.round(translateX), false);
      }
    },

    onTouchEnd: function () {
      var
        direction,
        slideToIndex;

      if (!this.isVerticalScroll && Math.abs(this.delta.x) > 0) {
        direction = this.delta.x < 0 ? 'right' : 'left';

        if (this.shouldSlide()) {
          if (direction === 'right') {
            slideToIndex = this.currentSlide + 1;
          } else {
            slideToIndex = this.currentSlide - 1;
          }
        } else {
          slideToIndex = this.currentSlide;
        }

        this.slideTo(slideToIndex, true);
      }
    },

    onWindowResize: function () {
      this.reset();
    },

    reset: function () {
      this.slideWidth = this.getSlideWidth();
      this.setWidths();
      this.slideTo(this.currentSlide, false);
    },

    slideTo: function (index, animate) {
      var
        _this = this,
        slideTo = this.slideWidth * index * -1;

      if (index !== this.currentSlide) {
        setTimeout(function () {
          _this.options.onSlideChange.call(_this);
        }, animate ? this.options.speed : 0);
      }

      this.currentSlide = index;
      this.setSlidePos(slideTo, animate);
      this.x = slideTo;

      return this;
    },

    setSlidePos: function (x, animate) {
      if (this.supports.transitions) {
        this.setTransform(x, animate);
      } else {
        this.setLeft(x, animate);
      }
    },

    setTransform: function (x, animate) {
      var
        _this = this,
        listStyle = this.list.style,
        transition,
        transform,
        vendorPrefix,
        i;

      for (i = this.vendorPrefixes.length - 1; i >= 0; i = i - 1) {
        vendorPrefix = this.vendorPrefixes[i];
        transition = vendorPrefix + 'Transition';
        transform = vendorPrefix + 'Transform';

        if (animate) {
          listStyle[transition] = 'all ' + _this.options.speed + 'ms linear';
        } else {
          listStyle[transition] = 'none';
        }

        listStyle[transform] = 'translate3d(' + x + 'px, 0, 0)';
      }

      if (animate) {
        setTimeout(function () {
          _this.options.onAfterSlide.call(_this);
        }, this.options.speed);
      }

      return this;
    },

    setLeft: function (x, animate) {
      if (animate) {
        this.animateLeft(x);
      } else {
        this.list.style.left = x + 'px';
      }

      return this;
    },

    animateLeft: function (x) {
      var
        _this = this,
        from = parseInt(this.list.style.left || 0, 10),
        to = x,
        startTime = +new Date(),
        interval;

      interval = setInterval(function () {
        var
          time = +new Date(),
          elapsedTime = time - startTime;

        x =
          (to - from) *
          ((elapsedTime / _this.options.speed) * 100) /
          100 + from;

        if (elapsedTime < _this.options.speed) {
          _this.setLeft(Math.round(x), false);
        } else {
          _this.setLeft(to, false);
          clearInterval(interval);
          _this.options.onAfterSlide.call(_this);
        }
      }, 10);
    },

    isFirstSlideSlidingLeft: function () {
      return this.currentSlide === 0 && this.delta.x > 0;
    },

    isLastSlideSlidingRight: function () {
      return this.currentSlide === this.slides.length - 1 && this.delta.x < 0;
    },

    getIsVerticalScroll: function () {
      return Math.abs(this.delta.x) < Math.abs(this.delta.y);
    },

    shouldSlide: function () {
      var
        duration = +new Date() - this.start.t,
        shouldSlide,
        slideFast,
        slideLong,
        absDeltaX = Math.abs(this.delta.x);

      if ((this.isFirstSlideSlidingLeft() || this.isLastSlideSlidingRight()) && !this.options.loop) {
        shouldSlide = false;
      } else {
        slideFast = absDeltaX > 20 && duration < this.options.speed;
        slideLong = absDeltaX > this.slideWidth / 2;
        shouldSlide = slideFast || slideLong;
      }

      return shouldSlide;
    },

    mergeOptions: function (options) {
      var i;

      options = options || {};

      for (i in options) {
        if (options.hasOwnProperty(i)) {
          this.options[i] = options[i];
        }
      }
    }
  };

  win.Touchslide = touchslide;

  if (win.jQuery || win.Zepto) {
    (function ($) {
      $.fn.touchslide = function (options) {
        return this.each(function () {
          $(this).data('touchslide', new win.Touchslide($(this)[0], options));
        });
      };
    }(win.jQuery || win.Zepto));
  }

}(window, document));
