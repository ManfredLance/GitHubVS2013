/**
 * Site wide helpers
 */


define('helpers', ['modernizr', 'fastclick', 'position'], function (Modernizr, FastClick, position) {
  return {
    init: function() {
      this.setupFastclick();
    },

    setupFastclick: function() {
      if (Modernizr.touch) {
        FastClick.attach(document.body);

        // Google places suggestions dropdown needs the 'needsclick' class to
        // be clickable
        $(document).on({
          DOMNodeInserted: function() {
            $('.pac-item, .pac-item span', this).addClass('needsclick');
          }
        }, '.pac-container');
      }
    },
    getQueryVariable: function(variable, query) {
      var vars = query.replace('?', '').split('&');

      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (pair[0] == variable) {
          return pair[1];
        }
      }
      return false;
    },

    getDistanceBetweenPoints: function(lat1, lng1, lat2, lng2) {
      var
        R = 6371, // Radius of the earth in km
        dLat = this.deg2rad(lat2 - lat1),
        dLng = this.deg2rad(lng2 - lng1),
        a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
          Math.sin(dLng/2) * Math.sin(dLng/2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)),
        d = R * c;

      // distance in km
      return d;
    },

    getDistanceBetweenPointsInWords: function(lat1, lng1, lat2, lng2) {
      var
        distanceInKm = this.getDistanceBetweenPoints(lat1, lng1, lat2, lng2),
        distanceInMeter,
        suffix,
        distance;

        // Round distance to nearest 100 meter if distance is below 1 km
        // Round up distance to 100 meter if distance is below 100 meter
        // Show rounded distance without decimals if distance is more than 10 km
        // Show rounded distance with one decimal if distance is between 1 and 10 km

        if (distanceInKm < 1) {
          distanceInMeter = distanceInKm * 1000;
          if (distanceInMeter < 100) {
            distance = Math.ceil((distanceInMeter) / 100) * 100;
          } else {
            distance = Math.round((distanceInMeter) / 100) * 100;
          }
          suffix = 'meter';
        } else if (distanceInKm > 10) {
          distance = Math.round(distanceInKm);
          suffix = 'km';
        } else {
          distance = (Math.round(distanceInKm * 10) / 10);
          suffix = 'km';
        }

      return distance + ' ' + suffix;
    },

    getDistanceFromUser: function(lat, lng, callback) {
      var _this = this;
      if (Modernizr.geolocation) {
        position.get(function(userLat, userLng) {
          var distance = _this.getDistanceBetweenPointsInWords(
            userLat,
            userLng,
            lat,
            lng
          );

          if (typeof callback === 'function') {
            callback.call(null, distance);
          }
        });
      } else {
        if (typeof callback === 'function') {
          callback.call(null, null);
        }
      }

    },

    deg2rad: function(x) {
      return x * Math.PI / 180;
    },

    arrayChunk: function(array, chunkSize) {
      return [].concat.apply(
        [],
        array.map(function(elem, i) {
          return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
        })
      );
    },

    arrayMax: function(array) {
      return Math.max.apply(Math, array);
    },

    removeProperty: function($els, property) {
      $els.each(function() {
        if (this.style.removeProperty) {
          this.style.removeProperty(property);
        } else {
          this.style.removeAttribute(property);
        }
      });

      return $els;
    },

    // a bit modified hack to select first option on gmaps autocomplete (no support for browsers lacking addEventListener)
    // http://stackoverflow.com/questions/7865446/google-maps-places-api-v3-autocomplete-select-first-option-on-enter
    selectFirstOptionOnEnter: function(input) {
      if (!input.addEventListener) {
        return;
      }

      // store the original event binding function
      var _addEventListener = input.addEventListener;

      function addEventListenerWrapper(type, listener) {
        // Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected,
        // and then trigger the original listener.
        if (type == "keydown") {
          var orig_listener = listener;
          listener = function(event) {
            var suggestion_selected = $(".pac-item-selected").length > 0;
            if (event.which == 13 && !suggestion_selected && input.value !== '') {
              var simulated_downarrow = $.Event("keydown", {
                keyCode: 40,
                which: 40
              });
              orig_listener.apply(input, [simulated_downarrow]);
            }

            orig_listener.apply(input, [event]);
          };
        }

        _addEventListener.apply(input, [type, listener]);
      }

      input.addEventListener = addEventListenerWrapper;
    },

    cookies: {
      create: function(name, value, days) {
        var
          date,
          expires;

        if (days) {
          date = new Date();
          date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
          expires = '; expires=' + date.toGMTString();
        } else {
          expires = '';
        }

        document.cookie = name + '=' + value + expires + '; path=/';
      },

      read: function(name) {
        var
          nameEQ = name + '=',
          ca = document.cookie.split(';'),
          i;

        for (i = 0; i < ca.length; i++) {
          var c = ca[i];

          while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
          }

          if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
          }
        }

        return null;
      },

      erase: function(name) {
        this.create(name, '', -1);
      }
    }
  };
});
