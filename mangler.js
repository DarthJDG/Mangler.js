/**
 * Mangler.js - JavaScript object processing library
 * Copyright (C) 2014
 *
 * See AUTHORS file for the list of contributors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var Mangler = (function() {

	function filterToRegExp(filter) {
		if(filter === '') {
			filter = '.*';
		} else {
			// Each filter should start with [ or .
			if(filter[0] !== '[' && filter[0] !== '.') filter = '.' + filter;
			filter = filter.replace(/\|([^\.\[])/g, '|.$1');

			// Escape special characters
			filter = filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

			// RegExp should check for endings
			filter = '.*' + filter + '$';

			// Handle empty array selectors
			filter = filter.replace(/\\\[\\\]/g, '\\[\\d+\\]');

			// Handle * selectors
			filter = filter.replace(/\\\.\\\*/g, '([\\.\\[].*|)');

			// Handle .? selectors (prefix or single item)
			filter = filter.replace(/\\\.\\\?/g, '\\.[^\\.]*');

			// Handle ? selectors (suffix)
			filter = filter.replace(/\\\?/g, '[^\\.]*');

			// Handle | selectors (multi)
			filter = filter.replace(/\\\|/g, '$|.*');
		}
		return new RegExp(filter);
	}

	function ManglerObject(items) {
		this.items = [];
		this.add(items);
	}

	var fn = function(item) {
		return new ManglerObject(item);
	}

	fn.isArray = function(obj) { return Object.prototype.toString.call(obj) === '[object Array]'; }
	fn.isObject = function(obj) { return Object.prototype.toString.call(obj) === '[object Object]'; }
	fn.isFunction = function(obj) { return Object.prototype.toString.call(obj) === '[object Function]'; }

	fn.clone = function(obj) {
		var res, item, i, k, v;

		if(fn.isArray(obj)) {
			res = [];
			for(i = 0; i < obj.length; i++) {
				item = obj[i];
				if(typeof item != 'undefined' && item != null) {
					res[i] = fn.clone(item);
				}
			}
		} else if(fn.isObject(obj)) {
			res = {};
			for(k in obj) {
				v = obj[k];
				if(typeof v != 'undefined' && v != null) {
					res[k] = fn.clone(v);
				}
			}
		} else {
			return obj;
		}
		return res;
	}

	fn.toCase = function(str, type) {
		var i, word;

		// Break string to words
		if(!fn.isArray(str)) {
			if(str.indexOf('_') === -1) {
				// No underscores in the string, try to be clever
				str = str.replace(/([a-z][A-Z])([A-Z][a-z])/g, '$1_$2')
				str = str.replace(/([a-z])([A-Z])/g, '$1_$2');
				str = str.replace(/([a-zA-Z])([0-9])/g, '$1_$2');
				str = str.replace(/([0-9])([a-zA-Z])/g, '$1_$2');
			}

			// At this point, the string is underscored
			// Handle simple returns before splitting
			switch(type) {
				case '_': return str;
				case 'upper_': return str.toUpperCase();
				case 'lower_': return str.toLowerCase();
			}

			// Convert to array
			str = str.split('_');
		}

		switch(type) {
			case '_':
				return str.join('_');

			case 'upper_':
				return str.join('_').toUpperCase();

			case 'lower_':
				return str.join('_').toLowerCase();

			case 'title':
			case 'camel':
				for(i = 0; i < str.length; i++) {
					word = str[i].toLowerCase();
					if(word !== '' && type === 'title' || i > 0) {
						word = word[0].toUpperCase() + word.slice(1);
					}
					str[i] = word;
				}
				return str.join('');
		}
	}

	fn.each = function(obj, callback) {
		var item, i, k;

		if(fn.isFunction(callback)) {
			if(fn.isArray(obj)) {
				for(i = 0; i < obj.length; i++) {
					item = obj[i];
					if(typeof item != 'undefined') {
						callback(i, item);
					}
				}
			} else if(fn.isObject(obj)) {
				for(k in obj) {
					callback(k, obj[k]);
				}
			}
		}
	}

	fn.explore = function(obj, callback, path, state) {
		if(fn.isFunction(callback)) {
			if(typeof path != 'string') path = '';
			if(typeof state != 'undefined') state = fn.merge({}, state);
			fn.each(obj, function(k, v) {
				if(callback(k, v, path, state) !== false && (fn.isArray(v) || fn.isObject(v))) {
					fn.explore(v, callback, path + (fn.isArray(obj) ? '[' + k + ']' : '.' + k), state);
				}
			});
		}
	}

	fn.merge = function(dst, src) {
		if(!fn.isObject(dst) || !fn.isObject(src)) return dst;
		for(var k in src) dst[k] = src[k];
		return dst;
	}

	ManglerObject.prototype.add = function(item) {
		if(typeof item != 'undefined') {
			if(fn.isArray(item)) {
				this.items = this.items.concat(item);
			} else {
				this.items.push(item);
			}
		}
		return this;
	}

	ManglerObject.prototype.clone = function() {
		return new ManglerObject(fn.clone(this.items));
	}

	ManglerObject.prototype.each = function(callback) {
		if(fn.isFunction(callback)) {
			fn.each(this.items, callback);
		}
		return this;
	}

	ManglerObject.prototype.explore = function(callback, path, state) {
		if(fn.isFunction(callback)) {
			fn.explore(this.items, callback, path, state);
		}
		return this;
	}

	ManglerObject.prototype.extract = function(filter, options) {
		var mangler = this,
			items = this.items,
			op;

		// Process filters
		if(fn.isArray(filter)) {
			filter = filterToRegExp(filter.join('|'))
		} else if(!(filter instanceof RegExp)) {
			if(typeof filter == 'string') {
				filter = filterToRegExp(filter);
			} else {
				return this;
			}
		}

		// Apply default options
		op = fn.clone(fn.merge({
			method: 'add',
			key: false,
			prop: false,
			drilldown: false
		}, options));
		op.key = op.key === true ? 'key' : op.key;
		op.prop = op.prop === true ? 'prop' : op.prop;

		this.items = [];
		fn.explore(items, function(k, v, path, state) {
			var item, i, m;

			path = path + (typeof k != 'string' ? '[' + k + ']' : '.' + k);
			if(filter.test(path)) {
				// Add keys and props to objects
				if(op.key !== false || op.prop !== false) {
					if(fn.isArray(v)) {
						if(op.method === 'add') {
							for(i = 0; i < v.length; i++) {
								item = v[i];
								if(fn.isObject(item)) {
									if(op.key !== false) item[op.key] = i;
									if(op.prop !== false) {
										m = path.match(/\.([^\.\[]*)$/);
										if(m != null) item[op.prop] = m[1];
									}
								}
							}
						}
					} else if(fn.isObject(v)) {
						if(op.key !== false) v[op.key] = k;
						if(op.prop !== false) {
							m = path.match(/\.([^\.\[]*)[0-9\[\]]*$/);
							if(m != null) v[op.prop] = m[1];
						}
					}
				}

				// Add to items with the preferred method
				if(op.method === 'add') {
					mangler.add(v);
				} else {
					mangler.push(v);
				}

				// Drill down into a matched object?
				if(!op.drilldown) return false;
			}
		}, '', {});
		return this;
	}

	ManglerObject.prototype.flatten = function(options) {
		// Apply default options
		var op = fn.clone(fn.merge({
			limit: 0,
			toCase: '_'
		}, options));

		// Iterate through all top-level objects
		fn.explore(this.items, function(key, obj) {
			var more, limit, o;

			if(fn.isObject(obj)) {
				// This object needs to be flattened
				more = false;
				limit = op.limit;

				do {
					// Create a new object to store the flattened items
					o = {};

					// Iterate through all properties
					more = false;
					fn.each(obj, function(prop, val) {
						if(fn.isArray(val) || fn.isObject(val)) {
							fn.each(val, function(k, v) {
								if(op.toCase === '_') {
									o[prop + '_' + k] = v;
								} else {
									o[fn.toCase(prop + '_' + k, op.toCase)] = v;
								}
								if(fn.isArray(v) || fn.isObject(v)) more = true;
							});
							delete obj[prop];
						}
					});

					// Merge new flattened items back into object
					fn.merge(obj, o);
				} while(more && (op.limit == 0 || --limit > 0))

				// Don't go any deeper into the object
				return false;
			}
		});
		return this;
	}

	ManglerObject.prototype.index = function(prop) {
		var index = {};
		fn.each(this.items, function(i, v) {
			index[v[prop]] = v;
		});
		return index;
	}

	ManglerObject.prototype.push = function(item) {
		if(typeof item != 'undefined') {
			this.items.push(item);
		}
		return this;
	}

	ManglerObject.prototype.remove = function(item) {
		var i = this.items.indexOf(item);
		if(i > -1) this.items.splice(i, 1);
	}

	return fn;

})();
