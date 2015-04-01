/*
 * Title: Favorites
 * Description: Handle favorites
 *
 */

define('Favorites', ['jquery', 'helpers', 'Analytics'], function($, helpers, Analytics) {
  'use strict';

  var Favorites = {
    add: function(id) {
      if (!this.isFavorite(id)) {
        this.list.push(id);
        this._save();

        Analytics.track({
          category: 'Favoriter',
          action: 'Lägg till',
          label: id,
          value: this.list.length
        });
      }

      return this;
    },

    remove: function(id) {
      if (this.isFavorite(id)) {
        this._removeIdFromArray(id)._save();

        Analytics.track({
          category: 'Favoriter',
          action: 'Ta Bort',
          label: id,
          value: this.list.length
        });
      }

      return this;
    },

    isFavorite: function(id) {
      return $.inArray(id, this.list) !== -1;
    },

    /***** Private *****/

    _init: function() {
      this.name = 'preem_favorite_stations';
      this.list = this._get();

      return this;
    },

    _save: function() {
      helpers.cookies.create(this.name, JSON.stringify(this.list), 365);

      return this;
    },

    _removeIdFromArray: function(id) {
      var index = $.inArray(id, this.list);

      this.list.splice(index, 1);

      return this;
    },

    _get: function() {
      var data = helpers.cookies.read(this.name) || '[]';

      return JSON.parse(data);
    }
  };

  Favorites._init();

  return Favorites;
});
