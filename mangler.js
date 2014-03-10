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
	
	function ManglerObject(objectArray) {
		this.items = objectArray;
	}
	
	var fn = function(obj) {
		return new ManglerObject([]).add(obj);
	}
	
	fn.clone = function(obj) {
		var res;
		if(obj instanceof Array) {
			res = [];
			for(var i = 0; i < obj.length; i++) {
				var item = obj[i];
				if(typeof item != 'undefined' && item != null) {
					res[i] = fn.clone(item);
				}
			}
		} else if(typeof obj == 'object') {
			res = {};
			for(var k in obj) {
				var v = obj[k];
				if(typeof v != 'undefined' && v != null) {
					res[k] = fn.clone(v);
				}
			}
		} else {
			return obj;
		}
		return res;
	}
	
	fn.each = function(obj, callback) {
		if(obj instanceof Array) {
			for(var i = 0; i < obj.length; i++) {
				var item = obj[i];
				if(typeof item != 'undefined') {
					callback(i, item);
				}
			}
		} else if(typeof obj == 'object') {
			for(var k in obj) {
				callback(k, obj[k]);
			}
		}
	}
	
	fn.explore = function(obj, callback, path, state) {
		if(typeof path != 'string') path = '';
		if(typeof state != 'undefined') state = fn.merge({}, state);
		fn.each(obj, function(k, v) {
			if(callback(k, v, path, state) !== false && typeof v == 'object') {
				fn.explore(v, callback, path + (obj instanceof Array ? '[' + k + ']' : '.' + k), state);
			}
		});
	}
	
	fn.merge = function(dst, src) {
		if(typeof dst != 'object' || typeof src != 'object') return dst;
		for(var k in src) dst[k] = src[k];
		return dst;
	}
	
	ManglerObject.prototype.add = function(obj) {
		if(typeof obj != 'undefined') {
			if(obj instanceof Array) {
				this.items = this.items.concat(obj);
			} else {
				this.items.push(obj);
			}
		}
		return this;
	}
	
	ManglerObject.prototype.clone = function() {
		return new ManglerObject(fn.clone(this.items));
	}
	
	ManglerObject.prototype.each = function(callback) {
		if(typeof callback != 'function') return this;
		fn.each(this.items, callback);
		return this;
	}
	
	ManglerObject.prototype.explore = function(callback, path, state) {
		if(typeof callback != 'function') return this;
		fn.explore(this.items, callback, path, state);
		return this;
	}
	
	ManglerObject.prototype.extract = function(filter, options) {
		// Process filters
		if(filter instanceof Array) {
			filter = filterToRegExp(filter.join('|'))
		} else if(!(filter instanceof RegExp)) {
			if(typeof filter == 'string') {
				filter = filterToRegExp(filter);
			} else {
				return this;
			}
		}
		
		// Apply default options
		var op = fn.clone(fn.merge({
			method: 'add',
			key: false,
			prop: false,
			drilldown: false
		}, options));
		op.key = op.key === true ? 'key' : op.key;
		op.prop = op.prop === true ? 'prop' : op.prop;
		
		var mangler = this;
		var items = this.items;
		this.items = [];
		fn.explore(items, function(k, v, path, state) {
			path = path + (typeof k != 'string' ? '[' + k + ']' : '.' + k);
			if(filter.test(path)) {
				var i, item, m;
				// Add keys and props to objects
				if(op.key !== false || op.prop !== false) {
					if(v instanceof Array) {
						if(op.method === 'add') {
							for(i = 0; i < v.length; i++) {
								item = v[i];
								if(!(item instanceof Array) && typeof item == 'object') {
									if(op.key !== false) item[op.key] = i;
									if(op.prop !== false) {
										m = path.match(/\.([^\.\[]*)$/);
										if(m != null) item[op.prop] = m[1];
									}
								}
							}
						}
					} else if(typeof v == 'object') {
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
			limit: 0
		}, options));

		// Iterate through all top-level objects
		fn.explore(this.items, function(key, obj) {
			if(!(obj instanceof Array) && typeof obj == 'object') {
				// This object needs to be flattened
				var more = false;
				var limit = op.limit;
				
				do {
					// Create a new object to store the flattened items
					var o = {};
					
					// Iterate through all properties
					more = false;
					fn.each(obj, function(prop, val) {
						if(typeof val == 'object') {
							fn.each(val, function(k, v) {
								o[prop + '_' + k] = v;
								if(typeof v == 'object') more = true;
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
	
	ManglerObject.prototype.index = function(field) {
		var index = {};
		fn.each(this.items, function(i, v) {
			index[v[field]] = v;
		});
		return index;
	}
	
	ManglerObject.prototype.push = function(obj) {
		if(typeof obj != 'undefined') {
			this.items.push(obj);
		}
		return this;
	}
	
	return fn;
	
})();
