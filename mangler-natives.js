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
	// Generic handler for typed arrays
	var typedArrayHandler = {
		clone: function(obj) {
			var func = global[Mangler.getType(obj)];
			return new func(obj);
		},

		each: function(obj, callback) {
			var item, i;
			for(i = 0; i < obj.length; i++) {
				item = obj[i];
				if(typeof item != 'undefined') {
					callback(i, item);
				}
			}
		}
	};

	Mangler.registerType('Float32Array', typedArrayHandler);
	Mangler.registerType('Float64Array', typedArrayHandler);
	Mangler.registerType('Int8Array', typedArrayHandler);
	Mangler.registerType('Int16Array', typedArrayHandler);
	Mangler.registerType('Int32Array', typedArrayHandler);
	Mangler.registerType('Uint8Array', typedArrayHandler);
	Mangler.registerType('Uint16Array', typedArrayHandler);
	Mangler.registerType('Uint32Array', typedArrayHandler);
	Mangler.registerType('Uint8ClampedArray', typedArrayHandler);

	Mangler.registerType('Boolean', {
		clone: function(obj) {
			return new Boolean(obj.valueOf());
		}
	});

	Mangler.registerType('Error', {
		clone: function(obj) {
			var func = global[obj.name];
			if(!Mangler.isFunction(func)) func = Error;
			return new func(obj);
		}
	});

	Mangler.registerType('Number', {
		clone: function(obj) {
			return new Number(obj.valueOf());
		}
	});

	Mangler.registerType('RegExp', {
		clone: function(obj) {
			return new RegExp(obj);
		}
	});

	Mangler.registerType('String', {
		clone: function(obj) {
			return new String(obj);
		}
	});
})(this);
