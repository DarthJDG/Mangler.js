/**
 * Mangler.js - JavaScript object processing library
 * Copyright (C) 2014
 *
 * Project: [http://codebin.co.uk/projects/mangler-js/]
 * GitHub:  [https://github.com/DarthJDG/Mangler.js]
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
var Mangler = (function(global) {

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

	// Re-usable handler functions
	var handlers = {
		standardClone: function(obj) {
			return obj.clone();
		},

		standardEach: function(obj, callback) {
			obj.each(callback);
		},

		standardGet: function(obj, i) {
			return obj.get(i);
		},

		copyConstructor: function(obj) {
			var func = types[fn.getType(obj)].$constructor;
			return new func(obj);
		},

		arrayLikeEach: function(obj, callback) {
			var item, i;
			for(i = 0; i < obj.length; i++) {
				item = obj[i];
				if(typeof item !== 'undefined') {
					if(callback(i, item) === false) return;
				}
			}
		},

		arrayLikeGet: function(obj, i) {
			return obj[i];
		},

		// Provides a fallback get interface for types with iterators. Should be avoided.
		eachGet: function(obj, i) {
			var ret, it = fn.getIterator(obj);

			if(typeof it === 'function') {
				it(obj, function(k, v) {
					if(k === i) {
						ret = v;
						return false;
					}
				});
			}

			return ret;
		}
	};

	// Built-in type handlers
	var types = {
		Object: {
			clone: function(obj) {
				var k, res = {};
				for(k in obj) {
					res[k] = fn.clone(obj[k]);
				}
				return res;
			},

			each: function(obj, callback) {
				for(var k in obj) {
					if(callback(k, obj[k]) === false) return;
				}
			},

			get: handlers.arrayLikeGet
		},

		Array: {
			clone: function(obj) {
				var i, item, res = [];
				for(i = 0; i < obj.length; i++) {
					item = obj[i];
					// Filter out undefined for sparse arrays
					if(typeof item !== 'undefined') {
						res[i] = fn.clone(item);
					}
				}
				return res;
			},

			each: handlers.arrayLikeEach,
			get: handlers.arrayLikeGet
		},

		ManglerObject: {
			clone: true,
			each: true,
			get: true
		},

		Date: {
			$constructor: Date,
			clone: 'constructor'
		}
	};

	fn.mergeType = function(typestring, obj) {
		var handler = types[typestring];
		if(!handler) handler = types[typestring] = {};
		fn.merge(handler, obj);
	}

	fn.registerType = function(typestring, obj) {
		types[typestring] = obj;
	}

	fn.getType = function(obj) {
		var name;

		if(typeof obj === 'undefined') {
			name = 'undefined';
		} else if(obj === null) {
			name = 'null';
		} else if(typeof obj === 'object') {
			name = Object.prototype.toString.call(obj).match(/^\[object (.*)\]$/)[1];
			if(name === 'Object') {
				name = obj.constructor.toString().match(/^function (.*)\(/)[1];
				if(!name) name = '$unknown';
			}
		} else if(typeof obj === 'function') {
			name = 'function';
		} else {
			name = '$value';
		}

		return name;
	}

	fn.getIterator = function(type) {
		if(typeof type !== 'string') type = fn.getType(type);

		var t = types[type];
		if(!t) return null;

		if(typeof t.each === 'function') {
			return t.each;
		} else if(t.each === true) {
			return handlers.standardEach;
		} else if(t.each === 'array') {
			return handlers.arrayLikeEach;
		}

		return null;
	}

	fn.getCloner = function(type) {
		if(typeof type !== 'string') type = fn.getType(type);

		var t = types[type];
		if(!t) return null;

		if(typeof t.clone === 'function') {
			return t.clone;
		} else if(t.clone === true) {
			return handlers.standardClone;
		} else if(t.clone === 'constructor' && typeof t.$constructor === 'function') {
			return handlers.copyConstructor;
		}

		return null;
	}

	fn.getGetter = function(type) {
		if(typeof type !== 'string') type = fn.getType(type);

		var t = types[type];
		if(!t) return null;

		if(typeof t.get === 'function') {
			return t.get;
		} else if(t.get === true) {
			return handlers.standardGet;
		} else if(t.get === 'array') {
			return handlers.arrayLikeGet;
		} else if(fn.getIterator(type)) {
			return handlers.eachGet;
		}

		return null;
	}

	fn.isArray = function(obj) { return fn.getType(obj) === 'Array'; }
	fn.isObject = function(obj) { return fn.getType(obj) === 'Object'; }

	fn.clone = function(obj) {
		var c = fn.getCloner(obj);
		return c ? c(obj) : obj;
	}

	fn.toCase = function(str, type) {
		var i, word;

		// Break string to words
		str = fn.tokenize(str);

		switch(type) {
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

			default:
				// Default to snake_case if no type set
				return str.join('_');
		}
	}

	fn.tokenize = function(str) {
		if(fn.isArray(str)) return str;

		if(str.indexOf('_') === -1) {
			// No underscores in the string, try to be clever
			str = str.replace(/([a-z][A-Z])([A-Z][a-z])/g, '$1_$2')
			str = str.replace(/([a-z])([A-Z])/g, '$1_$2');
			str = str.replace(/([a-zA-Z])([0-9])/g, '$1_$2');
			str = str.replace(/([0-9])([a-zA-Z])/g, '$1_$2');
		}

		// Convert to array
		return str.split('_');
	}

	fn.each = function(obj, callback) {
		var it;
		if(typeof callback === 'function') {
			it = fn.getIterator(obj);
			if(it) it(obj, callback);
		}
	}

	fn.explore = function(obj, callback, path, state) {
		if(typeof callback === 'function') {
			if(typeof path !== 'string') path = '';
			if(typeof state !== 'undefined') state = fn.merge({}, state);
			fn.each(obj, function(k, v) {
				if(callback(k, v, path, state) !== false && fn.getIterator(v)) {
					fn.explore(v, callback, path + ((typeof k !== 'string') ? '[' + k + ']' : '.' + k), state);
				}
			});
		}
	}

	fn.get = function(obj, i) {
		var g = fn.getGetter(obj);
		if(g) return g(obj, i);
	}

	fn.merge = function(dst, src) {
		if(!fn.isObject(dst) || !fn.isObject(src)) return dst;
		for(var k in src) dst[k] = src[k];
		return dst;
	}

	ManglerObject.prototype.add = function(item) {
		if(typeof item !== 'undefined') {
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
		fn.each(this.items, callback);
		return this;
	}

	ManglerObject.prototype.explore = function(callback, path, state) {
		fn.explore(this.items, callback, path, state);
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
			if(typeof filter === 'string') {
				filter = filterToRegExp(filter);
			} else {
				return this;
			}
		}

		// Apply default options
		op = fn.merge({
			method: 'add',
			key: false,
			prop: false,
			drilldown: false
		}, options);
		op.key = op.key === true ? 'key' : op.key;
		op.prop = op.prop === true ? 'prop' : op.prop;

		this.items = [];
		fn.explore(items, function(k, v, path, state) {
			var item, i, m;

			path = path + (typeof k !== 'string' ? '[' + k + ']' : '.' + k);
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
										m = path.match(/\.([^\.\[]*)[0-9\[\]]*$/);
										if(m !== null) item[op.prop] = m[1];
									}
								}
							}
						}
					} else if(fn.isObject(v)) {
						if(op.key !== false) v[op.key] = k;
						if(op.prop !== false) {
							m = path.match(/\.([^\.\[]*)[0-9\[\]]*$/);
							if(m !== null) v[op.prop] = m[1];
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

	ManglerObject.prototype.get = function(i) {
		return fn.get(this.items, i);
	}

	ManglerObject.prototype.flatten = function(options) {
		// Apply default options
		var op = fn.merge({
			limit: 0,
			toCase: '_'
		}, options);

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
				} while(more && (op.limit === 0 || --limit > 0))

				// Don't go any deeper into the object
				return false;
			}
		});
		return this;
	}

	ManglerObject.prototype.index = function(generator) {
		var index = {},
			func = (typeof generator === 'function'),
			ret;

		fn.each(this.items, function(i, v) {
			if(func) {
				ret = generator(i, v);
				if(ret !== false) index[ret] = v;
			} else {
				index[v[generator]] = v;
			}
		});
		return index;
	}

	ManglerObject.prototype.push = function(item) {
		if(typeof item !== 'undefined') {
			this.items.push(item);
		}
		return this;
	}

	ManglerObject.prototype.remove = function(item) {
		var i = this.items.indexOf(item);
		if(i > -1) this.items.splice(i, 1);
	}

	return fn;

})(this);
