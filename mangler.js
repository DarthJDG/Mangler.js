/**
 * Mangler.js - JavaScript object processing library
 * Copyright (C) 2014-2016
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
			return index !== -1;
		},

		registerType: function(obj, handler) {
			var index = resolveType(obj, true);
			if(index !== -1) {
				resolveHandlers(handlers[index] = handler);
			}
			return index !== -1;
		},

		removeType: function(obj) {
			var index = resolveType(obj, false);
			if(index !== -1) {
				constructors.splice(index, 1);
				handlers.splice(index, 1);
			}
			return index !== -1;
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

		isMangler: function(obj) {
			if(obj === null || typeof obj !== 'object') return false;
			return obj.constructor === ManglerObject;
		},

		isEmpty: function(obj) {
			var ret, it;

			if(obj === null || typeof obj === 'undefined' || obj === '') return true;
			if(!(it = fn.getIterator(obj))) return false;

			ret = true;
			fn.each(obj, function() {
				return ret = false;
			});
			return ret;
		},

		clone: function(obj) {
			var c = fn.getCloner(obj);
			return c ? c(obj) : obj;
		},

		test: function(obj, cond) {
			var res = true;

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

					case '$aggregate':
						if(v.length == 2) {
							res = fn.test(fn.aggregate(obj, v[0]), v[1]);
						} else {
							res = fn.test(fn.aggregate(obj, v[0], v[1]), v[2]);
						}
						break;

					default:
						res = fn.test(fn.getPath(obj, k), v);
				}
				if(!res) return false;
			};

			// Have to let 'function' through the first check to fix RegExp bug in old Androids
			if(cond === null || (typeof cond !== 'object' && typeof cond !== 'function')) {
				if(fn.isArray(obj)) {
					res = fn.test(obj, { $elemMatch: cond });
				} else {
					res = obj === cond;
				}
			} else if(cond.constructor === global.Object) {
				fn.each(cond, processConditions);
			} else if(cond.constructor === global.Array) {
				res = fn.test(obj, { $all: cond });
			} else if(cond.constructor === global.Function) {
				res = fn.test(obj, { $where: cond });
			} else if(fn.isArray(obj)) {
				res = fn.test(obj, { $elemMatch: cond });
			} else if(cond.constructor === global.RegExp) {
				res = cond.test(obj);
			} else {
				res = obj === cond;
			}

			return res;
		},

		rename: function(obj, dict) {
			var i, o;

			if(!fn.isObject(dict)) return obj;

			if(typeof obj === 'string') {

				// Rename string
				return dict[obj] || obj;

			} else if(fn.isArray(obj)) {

				// Rename array
				for(i = 0; i < obj.length; i++) obj[i] = fn.rename(obj[i], dict);
				return obj;

			} else if(fn.isObject(obj)) {

				// Rename object
				o = {};
				fn.each(obj, function(prop, val) {
					o[fn.rename(prop, dict)] = val;
					delete obj[prop];
				});
				fn.merge(obj, o);
				return obj;

			} else if(fn.isMangler(obj)) {

				// Rename mangler object
				for(i = 0; i < obj.items.length; i++) obj.items[i] = fn.rename(obj.items[i], dict);
				return obj;

			} else {
				// Return parameter as is
				return obj;
			}
		},

		transform: function(obj, options) {
			var i, o, word, delim;

			if(typeof obj === 'string') {

				// Transform string
				var op = fn.merge({
					to: '_',
					from: 'auto',
					ignore: []
				}, fn.isObject(options) ? options : { to: options || '_' });
				if(!fn.isArray(op.ignore)) op.ignore = [op.ignore];

				if(op.ignore.indexOf(obj) !== -1) return obj;
				obj = fn.tokenize(obj, op.from);
				delim = op.to[op.to.length - 1];

				switch(op.to) {
					case 'upper' + delim:
						return obj.join(delim).toUpperCase();

					case 'lower' + delim:
						return obj.join(delim).toLowerCase();

					case delim:
						return obj.join(delim);

					case 'title':
					case 'camel':
						for(i = 0; i < obj.length; i++) {
							word = obj[i].toLowerCase();
							if(word !== '' && op.to === 'title' || i > 0) {
								word = word[0].toUpperCase() + word.slice(1);
							}
							obj[i] = word;
						}
						return obj.join('');

					default:
						// Default to snake_case
						return obj.join('_');
				}

			} else if(fn.isArray(obj)) {

				// Transform array
				for(i = 0; i < obj.length; i++) obj[i] = fn.transform(obj[i], options);
				return obj;

			} else if(fn.isObject(obj)) {

				// Transform object
				o = {};
				fn.each(obj, function(prop, val) {
					o[fn.transform(prop, options)] = val;
					delete obj[prop];
				});
				fn.merge(obj, o);
				return obj;

			} else if(fn.isMangler(obj)) {

				// Transform mangler
				for(i = 0; i < obj.items.length; i++) obj.items[i] = fn.transform(obj.items[i], options);
				return obj;

			} else {
				// Return parameter as is
				return obj;
			}
		},

		tokenize: function(str, from) {
			if(fn.isArray(str)) return str;

			from = from || 'auto';
			var delim = from[from.length - 1];

			switch(from) {
				case 'upper' + delim:
				case 'lower' + delim:
				case delim:
					return str.split(delim);

				case 'title':
				case 'camel':
					break;

				case 'path':
					str = str.replace(/\[/g, '.');
					str = str.replace(/\]|^\.|\.$/g, '');
					return str.split('.');

				default:
					// Auto
					if(str.indexOf('_') !== -1) return str.split('_');
					if(str.indexOf('.') !== -1) return str.split('.');
					break;
			}

			// Convert from camel/title case
			str = str.replace(/([a-z][A-Z])([A-Z][a-z])/g, '$1_$2')
			str = str.replace(/([a-z])([A-Z])/g, '$1_$2');
			str = str.replace(/([a-zA-Z])([0-9])/g, '$1_$2');
			str = str.replace(/([0-9])([a-zA-Z])/g, '$1_$2');
			str = str.replace(/([A-Z])([A-Z][a-z])/g, '$1_$2');
			return str.split('_');
		},

		each: function(obj, callback) {
			var it;
			if(typeof callback === 'function') {
				it = fn.getIterator(obj);
				if(it) it(obj, callback);
			}
		},

		explore: function(obj, callback, state) {
			if(typeof callback === 'function') {
				state = fn.merge({
					$path: '',
					$prop: ''
				}, state);

				state.$parent = obj;
				state.$parentPath = state.$path;
				fn.each(obj, function(k, v) {
					if(typeof k === 'string') {
						state.$path = state.$parentPath + '.' + k;
						state.$prop = k;
					} else {
						state.$path = state.$parentPath + '[' + k + ']';
					}
					if(callback(k, v, state) !== false && fn.getIterator(v)) {
						fn.explore(v, callback, state);
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
				filter = filterToRegExp(typeof filter === 'string' ? filter : '*');
			}

			// Apply default options
			op = fn.merge({
				method: 'add',
				key: false,
				prop: false,
				drilldown: false,
				test: {}
			}, options);
			op.key = op.key === true ? 'key' : op.key;
			op.prop = op.prop === true ? 'prop' : op.prop;

			fn.explore(obj, function(k, v, state) {
				var item, i, m;

				if(filter.test(state.$path) && fn.test(v, op.test)) {
					// Add keys and props to objects
					if(op.key !== false || op.prop !== false) {
						if(fn.isArray(v)) {
							if(op.method === 'add') {
								for(i = 0; i < v.length; i++) {
									item = v[i];
									if(fn.isObject(item)) {
										if(op.key !== false) item[op.key] = i;
										if(op.prop !== false) item[op.prop] = state.$prop;
									}
								}
							}
						} else if(fn.isObject(v)) {
							if(op.key !== false) v[op.key] = k;
							if(op.prop !== false) v[op.prop] = state.$prop;
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
			});
			return ret;
		},

		filter: function(obj, cond) {
			if(fn.isArray(obj)) {
				var res = fn.find(obj, cond);
				obj.length = 0;
				global.Array.prototype.push.apply(obj, res);
			} else if (fn.isObject(obj)) {
				fn.each(obj, function(k, v) {
					if(!fn.test(v, cond)) delete obj[k];
				});
			} else if(fn.isMangler(obj)) {
				var res = fn.find(obj, cond);
				obj.items.length = 0;
				global.Array.prototype.push.apply(obj.items, res);
			}
			return obj;
		},

		find: function(obj, cond) {
			var arr = [];
			fn.each(obj, function(k, v) {
				if(fn.test(v, cond)) arr.push(v);
			});
			return arr;
		},

		findOne: function(obj, cond) {
			return fn.first(obj, cond);
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

		index: function(obj, generator, delimiter) {
			if(!fn.isArray(obj) && !fn.isMangler(obj)) return null;

			var index = {},
				isFunction = (typeof generator === 'function'),
				isArray = fn.isArray(generator);

			fn.each(obj, function(i, v) {
				var key;
				if(isFunction) {
					key = generator(i, v);
					if(key !== false) index[key] = v;
				} else if(isArray) {
					if(!delimiter) delimiter = '|';
					key = '';
					fn.each(generator, function(i, field) {
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

		deflate: function(obj, options) {
			var more, limit, o, op;

			if(fn.isObject(obj)) {
				// Apply default options
				var op = fn.merge({
					limit: 0,
					transform: '_'
				}, options);

				more = false;
				limit = op.limit;

				do {
					// Create a new object to store the deflated items
					o = {};

					// Iterate through all properties
					more = false;
					fn.each(obj, function(prop, val) {
						if(fn.isArray(val) || fn.isObject(val)) {
							fn.each(val, function(k, v) {
								if(op.transform === '_') {
									o[prop + '_' + k] = v;
								} else if(op.transform === '.') {
									o[prop + '.' + k] = v;
								} else {
									o[fn.transform(prop + '_' + k, op.transform)] = v;
								}
								if(fn.isArray(v) || fn.isObject(v)) more = true;
							});
							delete obj[prop];
						}
					});

					// Merge new deflated items back into object
					fn.merge(obj, o);
				} while(more && (op.limit === 0 || --limit > 0));
			}

			return obj;
		},

		inflate: function(obj, options) {
			var tokens, parentName, parent, last, num, temp, more, limit, o, op;

			if(fn.isObject(obj)) {
				op = fn.merge({
					limit: 0,
					transform: '_',
					from: '_'
				}, options);

				more = false;
				limit = op.limit;

				do {
					// Create a new object to store the inflated items
					o = {};

					// Iterate through all properties
					more = false;
					fn.each(obj, function(prop, val) {
						tokens = fn.tokenize(prop, op.from);

						if(tokens.length > 1) {
							// Take last token and add to object/array
							last = fn.transform(tokens.pop(), { to: op.transform, from: op.from });
							parentName = fn.transform(tokens.join('_'), { to: op.from });
							parent = obj[parentName] || o[parentName];

							// Set more flag if needed
							if(tokens.length > 1) more = true;

							// If last iteration, transform parent name
							if((tokens.length > 1 && limit === 1) || tokens.length === 1) {
								temp = fn.transform(parentName, { to: op.transform, from: '_' });
								if(parentName !== temp) {
									if(obj[parentName]) {
										obj[temp] = obj[parentName];
										delete obj[parentName];
									}
									if(o[parentName]) {
										o[temp] = o[parentName];
										delete o[parentName];
									}
									parentName = temp;
									parent = obj[parentName] || o[parentName];
								}
							}

							if(!fn.isObject(parent)) {
								// Check if last is a positive integer
								num = (/^0$|^[1-9][0-9]*$/).test(last);

								if(fn.isArray(parent)) {
									if(!num) {
										// Non-numeric property found, convert parent array to object
										temp = {};
										fn.each(parent, function(k, v) {
											temp[k] = v;
										});
										parent = temp;
										delete obj[parentName];
										o[parentName] = parent;
									}
								} else if(typeof parent === 'undefined') {
									parent = num ? [] : {};
									o[parentName] = parent;
								} else {
									// Parent is not object/array, don't change
									return;
								}
							}

							// Add value to parent object/array
							parent[last] = val;
							delete obj[prop];
						}
					});

					// Merge new inflated items back into object
					fn.merge(obj, o);
				} while(more && (op.limit === 0 || --limit > 0));
			}

			return obj;
		},

		get: function(obj, i) {
			var g = fn.getGetter(obj);
			if(g) return g(obj, i);
		},

		getPath: function(obj, path) {
			// Path has to be string
			if(typeof path !== 'string') return;
			if(path === '') return obj;

			var arr, ok = true;
			var tokens = fn.tokenize(path, 'path');
			fn.each(tokens, function(i, k) {
				if(typeof obj === 'undefined') return false;
				if(!k.length) return ok = false;
				if(fn.isArray(obj)) {
					if((/^0$|^[1-9][0-9]*$/).test(k)) {
						obj = fn.get(obj, k);
					} else {
						// Requesting an array item with a non-numeric key
						// Extract an array of values from its items
						arr = [];
						fn.each(obj, function(i, v) {
							v = fn.getPath(v, k);
							if(typeof v !== 'undefined') arr.push(v);
						});
						if(!arr.length) return ok = false;
						obj = arr;
					}
				} else {
					obj = fn.get(obj, k);
				}
			});

			if(ok) return obj; else return;
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
		},

		aggregate: function(obj, func, options) {
			var op, grouped, groupFunc, valueFunc, g, a;

			op = fn.merge({
				value: false,
				group: false
			}, fn.isObject(options) ? options : { value: options });

			if(typeof func === 'undefined') {
				func = aggregators.sum;
			} else if(typeof func === 'string') {
				func = aggregators[func];
			}

			if(typeof func !== 'function') return;

			groupFunc = (typeof op.group === 'function');
			valueFunc = (typeof op.value === 'function');

			a = { count: 0 };
			grouped = {};
			fn.each(obj, function(k, v) {
				if(op.group) {
					g = groupFunc ? op.group(k, v) : fn.getPath(v, op.group);
					a = grouped[g];
					if(!a) grouped[g] = a = { count: 0 };
				}
				if(op.value) v = valueFunc ? op.value(v) : fn.getPath(v, op.value);
				a.count++;
				func(k, v, a);
			});

			if(!op.group) {
				return a.result;
			} else {
				fn.each(grouped, function(k, v) {
					grouped[k] = v.result;
				});
				return grouped;
			}
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

		add: function() {
			var items = this.items;
			fn.each(arguments, function(k, item) {
				if(typeof item !== 'undefined') {
					if(fn.isArray(item)) {
						global.Array.prototype.push.apply(items, item);
					} else {
						items.push(item);
					}
				}
			});
			return this;
		},

		aggregate: function(func, options) {
			return fn.aggregate(this.items, func, options);
		},

		clear: function() {
			this.items.length = 0;
			return this;
		},

		clone: function() {
			return new ManglerObject(fn.clone(this.items));
		},

		copy: function() {
			return new ManglerObject(this.items);
		},

		deflate: function(options) {
			fn.each(this.items, function(key, obj) {
				fn.deflate(obj, options);
			});
			return this;
		},

		each: function(callback) {
			fn.each(this.items, callback);
			return this;
		},

		end: function() {
			return this.parent || this;
		},

		endAll: function() {
			var ret = this;
			while(ret.parent) ret = ret.parent;
			return ret;
		},

		explore: function(callback, state) {
			fn.explore(this.items, callback, state);
			return this;
		},

		extract: function(filter, options) {
			var m = new ManglerObject(fn.extract(this.items, filter, options));
			m.parent = this;
			return m;
		},

		filter: function(cond) {
			fn.filter(this.items, cond);
			return this;
		},

		find: function(cond) {
			var m = new ManglerObject(fn.find(this.items, cond));
			m.parent = this;
			return m;
		},

		findOne: function(cond) {
			var m = new ManglerObject(fn.first(this.items, cond));
			m.parent = this;
			return m;
		},

		first: function(cond) {
			return fn.first(this.items, cond);
		},

		get: function(i) {
			return this.items[i];
		},

		index: function(generator, delimiter) {
			return fn.index(this.items, generator, delimiter);
		},

		inflate: function(options) {
			fn.each(this.items, function(key, obj) {
				fn.inflate(obj, options);
			});
			return this;
		},

		last: function(cond) {
			return fn.last(this.items, cond);
		},

		limit: function(size) {
			if(size > 0 && this.items.length >= size) this.items.length = size;
			return this;
		},

		merge: function(src) {
			this.items = fn.merge(this.items, src);
			return this;
		},

		push: function() {
			var items = this.items;
			fn.each(arguments, function(k, item) {
				if(typeof item !== 'undefined') {
					items.push(item);
				}
			});
			return this;
		},

		remove: function(key) {
			if(fn.isObject(key) || typeof key === 'function') {
				fn.filter(this.items, { $not: key });
			} else {
				this.items.splice(key, 1);
			}
			return this;
		},

		removeItem: function(item) {
			var i = this.items.indexOf(item);
			if(i > -1) this.items.splice(i, 1);
			return this;
		},

		rename: function(dict) {
			fn.rename(this.items, dict);
			return this;
		},

		test: function(cond) {
			return fn.test(this.items, cond);
		},

		transform: function(options) {
			fn.transform(this.items, options);
			return this;
		}

	};

	// Built-in aggregators

	var aggregators = {
		sum: function(k, v, a) {
			a.result = a.count === 1 ? v : a.result + v;
		},

		mul: function(k, v, a) {
			a.result = a.count === 1 ? v : a.result * v;
		},

		avg: function(k, v, a) {
			a.result = a.count === 1 ? v : (a.result * (a.count - 1) + v) / a.count;
		},

		cnt: function(k, v, a) {
			a.result = a.count;
		},

		min: function(k, v, a) {
			a.result = a.count === 1 ? v : (a.result < v ? a.result : v);
		},

		max: function(k, v, a) {
			a.result = a.count === 1 ? v : (a.result > v ? a.result : v);
		},

		array: function(k, v, a) {
			if(!a.result) a.result = [];
			a.result.push(v);
		}
	};

	fn.merge(aggregators, {
		'+': aggregators.sum,
		'*': aggregators.mul,
		'<': aggregators.min,
		'>': aggregators.max,
		'[]': aggregators.array,
		add: aggregators.sum,
		count: aggregators.cnt
	});

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
