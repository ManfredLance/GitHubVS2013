define('googleMaps', function () {
  'use strict';

  var maps;

  if (google && google.maps) {
    maps = google.maps;
  } else {
    maps = null;
  }

  return maps;
});
