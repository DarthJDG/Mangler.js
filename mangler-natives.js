(function() {
	// Generic handler for typed arrays
	var typedArrayHandler = {
		clone: function(obj) {
			var func = window[Mangler.getType(obj)];
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
			return new window[obj.name](obj);
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
})();
