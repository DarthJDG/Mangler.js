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
	// Array compatibity fix for IE8-
	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(searchElement, fromIndex) {
			if (this == null) throw new TypeError('"this" is null or not defined');

			var O = Object(this);
			var len = O.length >>> 0;
			if (len === 0) return -1;

			var n = +fromIndex || 0;
			if (Math.abs(n) === Infinity) n = 0;
			if (n >= len) return -1;

			var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
			while (k < len) {
				if (k in O && O[k] === searchElement) return k;
				k++;
			}
			return -1;
		};
	}

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

	// Re-usable handler functions
	var genericHandlers = {
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
			return new obj.constructor(obj);
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

	var handlers = [];
	var constructors = [];
	var hasOwnProperty = global.Object.prototype.hasOwnProperty;

	// Return type index in list from instance or constructor
	// Returns -1 if not found or parameter is not an object/function
	function resolveType(obj, register) {
		if(obj === null) return -1;
		if(typeof obj === 'object') obj = obj.constructor;
		if(typeof obj !== 'function') return -1;

		var index = constructors.indexOf(obj);
		if(index === -1 && register) {
			// Register unknown constructor
			index = constructors.length;
			constructors[index] = obj;
			handlers[index] = {};
		}

		return index;
	}

	// Resolve final function references in the passed handler
	// It is called at the time of registration
	function resolveHandlers(h) {
		// Iterator
		if(typeof h.each !== 'function') {
			if(h.each === true) {
				h.each = genericHandlers.standardEach;
			} else if(h.each === 'array') {
				h.each = genericHandlers.arrayLikeEach;
			} else {
				h.each = null;
			}
		}

		// Cloner
		if(typeof h.clone !== 'function') {
			if(h.clone === true) {
				h.clone = genericHandlers.standardClone;
			} else if(h.clone === 'constructor') {
				h.clone = genericHandlers.copyConstructor;
			} else {
				h.clone = null;
			}
		}

		// Getter
		if(typeof h.get !== 'function') {
			if(h.get === true) {
				h.get = genericHandlers.standardGet;
			} else if(h.get === 'array') {
				h.get = genericHandlers.arrayLikeGet;
			} else if(h.each !== null) {
				// Fall-back getter using the iterator, should be avoided
				h.get = genericHandlers.eachGet;
			} else {
				h.get = null;
			}
		}
	}

	var fn = {

		init: function(item) {
			return new ManglerObject(item);
		},

		mergeType: function(obj, handler) {
			var index = resolveType(obj, true);
			if(index !== -1) {
				resolveHandlers(fn.merge(handlers[index], handler));
			}
		},

		registerType: function(obj, handler) {
			var index = resolveType(obj, true);
			if(index !== -1) {
				resolveHandlers(handlers[index] = handler);
			}
		},

		compareType: function(a, b) {
			if(a === b) return true;
			if(a === null || b === null) return false;
			if(b === global.Function && typeof a === 'function') return true;
			if(a === global.Function && typeof b === 'function') return true;

			if(typeof a === 'object') a = a.constructor;
			if(typeof b === 'object') b = b.constructor;
			if(typeof a === 'function' && typeof b === 'function') return a === b;

			return typeof a === typeof b;
		},

		getIterator: function(obj) {
			var i = resolveType(obj);
			if(i === -1) return null;
			return handlers[i].each;
		},

		getCloner: function(obj) {
			var i = resolveType(obj);
			if(i === -1) return null;
			return handlers[i].clone;
		},

		getGetter: function(obj) {
			var i = resolveType(obj);
			if(i === -1) return null;
			return handlers[i].get;
		},

		isArray: function(obj) {
			if(obj === null || typeof obj !== 'object') return false;
			return obj.constructor === global.Array;
		},

		isObject: function(obj) {
			if(obj === null || typeof obj !== 'object') return false;
			return obj.constructor === global.Object;
		},

		clone: function(obj) {
			var c = fn.getCloner(obj);
			return c ? c(obj) : obj;
		},

		test: function(obj, cond) {
			var temp, res = true;

			var processConditions = function(k, v) {
				switch(k) {
					case '$gt':
					case '>':
						res = obj > v;
						break;

					case '$gte':
					case '>=':
						res = obj >= v;
						break;

					case '$lt':
					case '<':
						res = obj < v;
						break;

					case '$lte':
					case '<=':
						res = obj <= v;
						break;

					case '$ne':
					case '!==':
						res = obj !== v;
						break;

					case '$eq':
					case '===':
						res = obj === v;
						break;

					case '==':
						res = obj == v;
						break;

					case '!=':
						res = obj != v;
						break;

					case '$or':
						res = false;
						fn.each(v, function(or_k, or_v) {
							res = fn.test(obj, or_v);
							if(res) return false;
						});
						break;

					case '$all':
						if(fn.isArray(obj)) {
							res = true;
							fn.each(v, function(arr_k, arr_v) {
								if(obj.indexOf(arr_v) === -1) {
									res = false;
									return false;
								}
							});
						} else {
							res = false;
						}
						break;

					case '$size':
						res = fn.isArray(obj) ? obj.length === v : false;
						break;

					case '$elemMatch':
						res = false;
						if(fn.isArray(obj)) {
							fn.each(obj, function(arr_k, arr_v) {
								if(fn.test(arr_v, v)) {
									res = true;
									return false;
								}
							});
						}
						break;

					case '$in':
						if(fn.isArray(obj)) {
							res = false;
							fn.each(v, function(arr_k, arr_v) {
								if(obj.indexOf(arr_v) !== -1) {
									res = true;
									return false;
								}
							});
						} else {
							res = v.indexOf(obj) !== -1;
						}
						break;

					case '$nin':
						res = !fn.test(obj, { $in: v });
						break;

					case '$not':
						res = !fn.test(obj, v);
						break;

					case '$nor':
						res = !fn.test(obj, { $or: v });
						break;

					case '$exists':
						res = (typeof obj !== 'undefined') === !!v;
						break;

					case '$type':
						res = fn.compareType(obj, v);
						break;

					case '$mod':
						res = (obj % v[0] === v[1]);
						break;

					case '$where':
						res = (typeof v === 'function') ? v(obj) : false;
						break;

					default:
						res = fn.test(fn.getPath(obj, k), v);
				}
				if(!res) return false;
			};

			// Have to let 'function' through the first check to fix RegExp bug in old Androids
			if(cond === null || (typeof cond !== 'object' && typeof cond !== 'function')) {
				res = obj === cond;
			} else if(cond.constructor === global.Object) {
				fn.each(cond, processConditions);
			} else if(cond.constructor === global.Array) {
				res = fn.test(obj, { $all: cond });
			} else if(cond.constructor === global.Function) {
				res = fn.test(obj, { $where: cond });
			} else if(cond.constructor === global.RegExp) {
				res = cond.test(obj);
			} else {
				res = obj === cond;
			}

			return res;
		},

		toCase: function(str, type) {
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

				case '.':
					return str.join('.');

				default:
					// Default to snake_case if no type set
					return str.join('_');
			}
		},

		tokenize: function(str) {
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
		},

		each: function(obj, callback) {
			var it;
			if(typeof callback === 'function') {
				it = fn.getIterator(obj);
				if(it) it(obj, callback);
			}
		},

		explore: function(obj, callback, path, state) {
			if(typeof callback === 'function') {
				if(typeof path !== 'string') path = '';
				if(typeof state !== 'undefined') state = fn.merge({}, state);
				fn.each(obj, function(k, v) {
					if(callback(k, v, path, state) !== false && fn.getIterator(v)) {
						fn.explore(v, callback, path + ((typeof k !== 'string') ? '[' + k + ']' : '.' + k), state);
					}
				});
			}
		},

		extract: function(obj, filter, options) {
			var op, ret = [];

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

			fn.explore(obj, function(k, v, path, state) {
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
					if(op.method === 'add' && fn.isArray(v)) {
						ret = ret.concat(v);
					} else {
						ret.push(v);
					}

					// Drill down into a matched object?
					if(!op.drilldown) return false;
				}
			}, '', {});
			return ret;
		},

		find: function(obj, cond) {
			var arr = [];
			fn.each(obj, function(k, v) {
				if(fn.test(v, cond)) arr.push(v);
			});
			return arr;
		},

		first: function(obj, cond) {
			var ret;
			if(typeof cond === 'undefined') cond = {};
			fn.each(obj, function(k, v) {
				if(fn.test(v, cond)) {
					ret = v;
					return false;
				}
			});
			return ret;
		},

		last: function(obj, cond) {
			var ret;
			if(typeof cond === 'undefined') cond = {};
			fn.each(obj, function(k, v) {
				if(fn.test(v, cond)) {
					ret = v;
				}
			});
			return ret;
		},

		flatten: function(obj, options) {
			var more, limit, o;

			// Apply default options
			var op = fn.merge({
				limit: 0,
				toCase: '_'
			}, options);

			if(fn.isObject(obj)) {
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
								} else if(op.toCase === '.') {
									o[prop + '.' + k] = v;
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
			}
		},

		get: function(obj, i) {
			var g = fn.getGetter(obj);
			if(g) return g(obj, i);
		},

		getPath: function(obj, path) {
			// Path has to be string
			if(typeof path !== 'string') return;

			var k;
			while(path.length !== 0 && typeof obj !== 'undefined') {
				// Trim starting dot if any
				if(path[0] === '.') {
					path = path.slice(1);
				}

				if(path[0] === '[') {
					// Path starts with an array index
					k = path.match(/^\[([^\]]*)\]/)[1];
					path = path.slice(k.length + 2);
					k = parseInt(k, 10);
					if(isNaN(k)) return;
				} else {
					// Must be a property name
					k = path.match(/^([^\.\[]*)/)[0];
					path = path.slice(k.length);
					if(!k.length) return;
				}
				obj = fn.get(obj, k);
			}

			return obj;
		},

		merge: function(dst, src) {
			if(dst === null || src === null) return dst;
			if(typeof dst !== 'object' && typeof dst !== 'function') return dst;
			if(typeof src !== 'object' && typeof src !== 'function') return dst;

			var dstFunc = dst.constructor;
			var srcFunc = src.constructor;

			if(srcFunc === global.Array) {
				if(dstFunc === global.Array) {
					// Merge two arrays of objects
					for(var i = 0; i < src.length && i < dst.length; i++) {
						fn.merge(dst[i], src[i]);
					}
				} else {
					// Merge an array of objects into a single object
					fn.each(src, function(key, obj) {
						fn.merge(dst, obj);
					});
				}
			} else {
				if(dstFunc === global.Array) {
					// Merge one object into an array of objects
					fn.each(dst, function(key, obj) {
						fn.merge(obj, src);
					});
				} else {
					// Merge two objects
					for(var k in src) {
						if(hasOwnProperty.call(src, k)) dst[k] = src[k];
					}
				}
			}

			return dst;
		}

	};

	// Assemble main function with static methods
	fn = fn.merge(fn.init, fn);
	delete fn.init;

	function ManglerObject(items) {
		this.items = [];
		this.add(items);
	}

	ManglerObject.prototype = {

		constructor: ManglerObject,

		add: function(item) {
			if(typeof item !== 'undefined') {
				if(fn.isArray(item)) {
					this.items = this.items.concat(item);
				} else {
					this.items.push(item);
				}
			}
			return this;
		},

		clone: function() {
			return new ManglerObject(fn.clone(this.items));
		},

		copy: function() {
			return new ManglerObject(this.items);
		},

		each: function(callback) {
			fn.each(this.items, callback);
			return this;
		},

		explore: function(callback, path, state) {
			fn.explore(this.items, callback, path, state);
			return this;
		},

		extract: function(filter, options) {
			this.items = fn.extract(this.items, filter, options);
			return this;
		},

		get: function(i) {
			return fn.get(this.items, i);
		},

		find: function(cond) {
			return fn.find(this.items, cond);
		},

		first: function(cond) {
			return fn.first(this.items, cond);
		},

		last: function(cond) {
			return fn.last(this.items, cond);
		},

		filter: function(cond) {
			this.items = this.find(cond);
			return this;
		},

		flatten: function(options) {
			fn.each(this.items, function(key, obj) {
				fn.flatten(obj, options);
			});
			return this;
		},

		index: function(generator, delimiter) {
			var index = {},
				func = (typeof generator === 'function'),
				ret;

			fn.each(this.items, function(i, v) {
				var key;
				if(func) {
					key = generator(i, v);
					if(key !== false) index[key] = v;
				} else if(fn.isArray(generator)) {
					if(!delimiter) delimiter = '|';
					key = '';
					Mangler.each(generator, function(i, field) {
						if(i > 0) key += delimiter;
						key += fn.getPath(v, field);
					});
					index[key] = v;
				} else {
					index[fn.getPath(v, generator)] = v;
				}
			});
			return index;
		},

		push: function(item) {
			if(typeof item !== 'undefined') {
				this.items.push(item);
			}
			return this;
		},

		remove: function(item) {
			var i = this.items.indexOf(item);
			if(i > -1) this.items.splice(i, 1);
		}

	};

	// Register natively supported object types

	fn.registerType(global.Object, {
		clone: function(obj) {
			var k, res = {};
			for(k in obj) {
				if(hasOwnProperty.call(obj, k)) {
					res[k] = fn.clone(obj[k]);
				}
			}
			return res;
		},

		each: function(obj, callback) {
			for(var k in obj) {
				if(hasOwnProperty.call(obj, k)) {
					if(callback(k, obj[k]) === false) return;
				}
			}
		},

		get: 'array'
	});

	fn.registerType(global.Array, {
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

		each: 'array',
		get: 'array'
	});

	fn.registerType(ManglerObject, {
		clone: true,
		each: true,
		get: true
	});

	fn.registerType(global.Date, {
		clone: 'constructor'
	});

	return fn;

})(this);
