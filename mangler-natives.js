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
(function(global) {
	// Generic array iterator
	var arrayIterator = function(obj, callback) {
		var item, i;
		for(i = 0; i < obj.length; i++) {
			item = obj[i];
			if(typeof item != 'undefined') {
				callback(i, item);
			}
		}
	};

	// List of native typed arrays
	var typedArrays = [
		'Float32Array', 'Float64Array',
		'Int8Array', 'Int16Array', 'Int32Array',
		'Uint8Array', 'Uint16Array', 'Uint32Array', 'Uint8ClampedArray'
	];

	// Register typed arrays if they are supported
	Mangler.each(typedArrays, function(i, type) {
		var func = global[type];
		if(func) {
			Mangler.registerType(type, { $constructor: func, clone: 'constructor', each: arrayIterator });
		}
	});

	// Native types with working copy-constructor
	Mangler.registerType('RegExp', { $constructor: global['RegExp'], clone: 'constructor' });
	Mangler.registerType('String', { $constructor: global['String'], clone: 'constructor' });

	// Native types with custom handlers

	Mangler.registerType('Boolean', {
		clone: function(obj) {
			return new Boolean(obj.valueOf());
		}
	});

	Mangler.registerType('Number', {
		clone: function(obj) {
			return new Number(obj.valueOf());
		}
	});

	Mangler.registerType('Error', {
		clone: function(obj) {
			var func = global[obj.name];
			if(!Mangler.isFunction(func)) func = Error;
			return new func(obj);
		}
	});
})(this);
