(function(global, undefined) {

	QUnit.module('Utility');

	// TODO: mergeType, registerType, compareType

	QUnit.test('Mangler.getIterator', function(assert) {
		assert.expect(1);

		var m = Mangler(['A', 'B', 'C']);
		var result = '';

		Mangler.getIterator(m)(m, function(k, v) {
			result += v;
		});

		assert.strictEqual(result, 'ABC', 'get iterator of Mangler object');
	});

	QUnit.test('Mangler.getCloner', function(assert) {
		assert.expect(4);

		var m = Mangler({ one: 1 });
		var mc = Mangler.getCloner(m)(m);
		mc.items[0].one = 2;

		assert.notStrictEqual(m, mc, 'passed reference test');
		assert.notStrictEqual(m.items, mc.items, 'passed reference test');
		assert.notStrictEqual(m.items[0], mc.items[0], 'passed reference test');
		assert.notStrictEqual(m.items[0].one, mc.items[0].one, 'passed reference test');
	});

	QUnit.test('Mangler.getGetter', function(assert) {
		assert.expect(1);

		var m = Mangler(['A', 'B', 'C']);
		var result = Mangler.getGetter(m)(m, 1);

		assert.strictEqual(result, 'B', 'get getter of Mangler object');
	});

	QUnit.test('Mangler.isArray', function(assert) {
		assert.expect(16);

		function good(value, message) {
			assert.ok(Mangler.isArray(value), message);
		}

		function bad(value, message) {
			assert.ok(!Mangler.isArray(value), message);
		}

		bad(undefined, 'undefined');
		bad(null, 'null');
		bad({}, 'empty object literal');
		bad({ one: 1 }, 'object literal');
		good([], 'empty array literal');
		good([1, 2, 3], 'array literal');
		bad(new Date(), 'date object');
		bad('', 'empty string');
		bad('asd', 'string');
		bad(0, 'zero');
		bad(12, 'integer');
		bad(5.2, 'float');
		bad(function(){}, 'function');
		bad(/a/, 'regular expression');
		bad(Mangler(), 'empty mangler object');
		bad(Mangler(1), 'mangler object');
	});

	QUnit.test('Mangler.isObject', function(assert) {
		assert.expect(16);

		function good(value, message) {
			assert.ok(Mangler.isObject(value), message);
		}

		function bad(value, message) {
			assert.ok(!Mangler.isObject(value), message);
		}

		bad(undefined, 'undefined');
		bad(null, 'null');
		good({}, 'empty object literal');
		good({ one: 1 }, 'object literal');
		bad([], 'empty array literal');
		bad([1, 2, 3], 'array literal');
		bad(new Date(), 'date object');
		bad('', 'empty string');
		bad('asd', 'string');
		bad(0, 'zero');
		bad(12, 'integer');
		bad(5.2, 'float');
		bad(function(){}, 'function');
		bad(/a/, 'regular expression');
		bad(Mangler(), 'empty mangler object');
		bad(Mangler(1), 'mangler object');
	});

	QUnit.test('Mangler.isEmpty', function(assert) {
		assert.expect(16);

		function good(value, message) {
			assert.ok(Mangler.isEmpty(value), message);
		}

		function bad(value, message) {
			assert.ok(!Mangler.isEmpty(value), message);
		}

		good(undefined, 'undefined');
		good(null, 'null');
		good({}, 'empty object literal');
		bad({ one: 1 }, 'object literal');
		good([], 'empty array literal');
		bad([1, 2, 3], 'array literal');
		bad(new Date(), 'date object');
		good('', 'empty string');
		bad('asd', 'string');
		bad(0, 'zero');
		bad(12, 'integer');
		bad(5.2, 'float');
		bad(function(){}, 'function');
		bad(/a/, 'regular expression');
		good(Mangler(), 'empty mangler object');
		bad(Mangler(1), 'mangler object');
	});

	QUnit.test('Mangler.clone', function(assert) {
		assert.expect(9);

		var o1, o2;

		o1 = { a: 1, b: [ { c: new Date() } ] };
		o2 = Mangler.clone(o1);
		o2.a = 2;

		assert.notStrictEqual(o1, o2, 'passed reference test');
		assert.notStrictEqual(o1.a, o2.a, 'passed reference test');
		assert.notStrictEqual(o1.b, o2.b, 'passed reference test');
		assert.notStrictEqual(o1.b[0], o2.b[0], 'passed reference test');
		assert.notStrictEqual(o1.b[0].c, o2.b[0].c, 'passed reference test');

		o1 = Mangler({ one: 1 });
		o2 = Mangler.clone(o1);
		o2.items[0].one = 2;

		assert.notStrictEqual(o1, o2, 'passed reference test');
		assert.notStrictEqual(o1.items, o2.items, 'passed reference test');
		assert.notStrictEqual(o1.items[0], o2.items[0], 'passed reference test');
		assert.notStrictEqual(o1.items[0].one, o2.items[0].one, 'passed reference test');
	});

	QUnit.module('Static');

	// TODO: test
	QUnit.test('Mangler.test', function(assert) {
		assert.expect(99);
		
		function good(arg1, op, arg2) {
			var cond = {};
			cond[op] = arg2;
			assert.ok(Mangler.test(arg1, cond), 'true: ' + arg1 + ' ' + op + ' ' + arg2);
		}

		function bad(arg1, op, arg2) {
			var cond = {};
			cond[op] = arg2;
			assert.ok(!Mangler.test(arg1, cond), 'false: ' + arg1 + ' ' + op + ' ' + arg2);
		}
		
		var arg1s = [2, 2, 2, 'B', 'B', 'B'];
		var arg2s = [1, 2, 3, 'A', 'B', 'C'];
		
		function runAll(op, ok) {
			for(var i = 0; i < arg1s.length; i++) {
				if(ok[i]) {
					good(arg1s[i], op, arg2s[i]);
				} else {
					bad(arg1s[i], op, arg2s[i]);
				}
			}
		}
		
		// Simple comparisons
		runAll('$gt',  [1, 0, 0, 1, 0, 0]);
		runAll('>',    [1, 0, 0, 1, 0, 0]);
		runAll('$gte', [1, 1, 0, 1, 1, 0]);
		runAll('>=',   [1, 1, 0, 1, 1, 0]);
		runAll('$lt',  [0, 0, 1, 0, 0, 1]);
		runAll('<',    [0, 0, 1, 0, 0, 1]);
		runAll('$lte', [0, 1, 1, 0, 1, 1]);
		runAll('<=',   [0, 1, 1, 0, 1, 1]);
		runAll('$ne',  [1, 0, 1, 1, 0, 1]);
		runAll('!==',  [1, 0, 1, 1, 0, 1]);
		runAll('$eq',  [0, 1, 0, 0, 1, 0]);
		runAll('===',  [0, 1, 0, 0, 1, 0]);
		runAll('==',   [0, 1, 0, 0, 1, 0]);
		runAll('!=',   [1, 0, 1, 1, 0, 1]);
		
		// Strict checks
		bad(1, '$ne', 1);
		good(1, '$ne', '1');
		bad(1, '!==', 1);
		good(1, '!==', '1');
		good(1, '$eq', 1);
		bad(1, '$eq', '1');
		good(1, '===', 1);
		bad(1, '===', '1');
		good(1, '==', 1);
		good(1, '==', '1');
		bad(1, '!=', 1);
		bad(1, '!=', '1');
		
		// Check implicit and relations
		assert.ok(Mangler.test(2, { $gt: 1, $lt: 3 }), 'implicit and: both true');
		assert.ok(!Mangler.test(2, { $eq: 2, $lt: 2 }), 'implicit and: one true');
		assert.ok(!Mangler.test(2, { $lt: 2, $gt: 2 }), 'implicit and: none true');

		// $or operator
		assert.ok(Mangler.test(2, { $or: [{ $gt: 1 }, { $lt: 3 }] }), '$or: both true');
		assert.ok(Mangler.test(2, { $or: [{ $eq: 2 }, { $lt: 2 }] }), '$or: one true');
		assert.ok(!Mangler.test(2, { $or: [{ $lt: 2 }, { $gt: 2 }] }), '$or: none true');
		
		// $all operator
		assert.ok(Mangler.test([1, 2, 3], { $all: [1] }), '$all: 1 out of 3');
		assert.ok(Mangler.test([1, 2, 3], { $all: [1, 2] }), '$all: 2 out of 3');
		assert.ok(Mangler.test([1, 2, 3], { $all: [1, 2, 3] }), '$all: 3 out of 3');
		assert.ok(!Mangler.test([1, 2, 3], { $all: [1, 2, 3, 4] }), '$all: 1 extra');
		
		// $size operator
		assert.ok(Mangler.test([1, 2, 3], { $size: 3 }), '$size: true');
		assert.ok(!Mangler.test([1, 2, 3], { $size: 2 }), '$size: false');
		
		// TODO: $elemMatch

		// $in operator
		assert.ok(Mangler.test([1, 2, 3], { $in: [1] }), '$in: 1 out of 3');
		assert.ok(Mangler.test([1, 2, 3], { $in: [1, 2] }), '$in: 2 out of 3');
		assert.ok(Mangler.test([1, 2, 3], { $in: [1, 2, 3] }), '$in: 3 out of 3');
		assert.ok(Mangler.test([1, 2, 3], { $in: [1, 2, 3, 4] }), '$in: 1 extra');
		assert.ok(Mangler.test(1, { $in: [1, 2, 3, 4] }), '$in: value matches');
		assert.ok(!Mangler.test(5, { $in: [1, 2, 3, 4] }), '$in: value does not match');
	});

	QUnit.test('Mangler.rename', function(assert) {
		assert.expect(7);

		var result, dict = {
			'one': 'ONE',
			'two': 'TWO'
		};

		// String
		assert.strictEqual(Mangler.rename('one', dict), 'ONE', 'string 1');
		assert.strictEqual(Mangler.rename('two', dict), 'TWO', 'string 2');
		assert.strictEqual(Mangler.rename('three', dict), 'three', 'string 3');

		// Array
		result = Mangler.rename(['one', 'two', 'three'], dict);
		assert.deepEqual(result, ['ONE', 'TWO', 'three'], 'array');

		// Object
		result = Mangler.rename({ one: 1, two: 2, three: 3 }, dict);
		assert.deepEqual(result, { ONE: 1, TWO: 2, three: 3 }, 'object');

		// Other
		var r = /a/;
		assert.strictEqual(Mangler.rename(r, dict), r, 'other');

		// No dict passed
		result = Mangler.rename({ one: 1, two: 2, three: 3 });
		assert.deepEqual(result, { one: 1, two: 2, three: 3 }, 'no dict');
	});

	QUnit.test('Mangler.transform', function(assert) {
		assert.expect(10);
		var result;

		// Auto detection test
		assert.strictEqual(Mangler.transform('one_two_three'), 'one_two_three', 'detect snake');
		assert.strictEqual(Mangler.transform('one.two.three'), 'one_two_three', 'detect dot');
		assert.strictEqual(Mangler.transform('oneTwoTHREE123'), 'one_Two_THREE_123', 'detect camel 1');
		assert.strictEqual(Mangler.transform('oneTwoTHREEFour'), 'one_Two_THREE_Four', 'detect camel 2');
		assert.strictEqual(Mangler.transform('OneTwoThree'), 'One_Two_Three', 'detect title');

		// Forced source
		assert.strictEqual(Mangler.transform('one.two_three.four', { from: '.', to: 'title' }), 'OneTwo_threeFour', 'force dot');

		// Array
		result = Mangler.transform(['one_two', 'three_four'], { to: 'upper.' });
		assert.deepEqual(result, ['ONE.TWO', 'THREE.FOUR'], 'array');

		// Object
		result = Mangler.transform({ one_two: 1, three_four: 2 }, { to: 'upper#' });
		assert.deepEqual(result, { 'ONE#TWO': 1, 'THREE#FOUR': 2 }, 'object');

		// Ignore
		result = Mangler.transform(['one_two', 'three_four'], { to: 'upper.', ignore: ['one_two'] });
		assert.deepEqual(result, ['one_two', 'THREE.FOUR'], 'ignore in array');

		result = Mangler.transform({ one_two: 1, three_four: 2 }, { to: 'upper#', ignore: ['one_two'] });
		assert.deepEqual(result, { one_two: 1, 'THREE#FOUR': 2 }, 'ignore in object');
	});

	QUnit.test('Mangler.tokenize', function(assert) {
		assert.expect(8);
		var result;

		// Auto detection test
		assert.strictEqual(Mangler.tokenize('one_two_three').join(','), 'one,two,three', 'detect snake');
		assert.strictEqual(Mangler.tokenize('one.two.three').join(','), 'one,two,three', 'detect dot');
		assert.strictEqual(Mangler.tokenize('oneTwoTHREE123').join(','), 'one,Two,THREE,123', 'detect camel 1');
		assert.strictEqual(Mangler.tokenize('oneTwoTHREEFour').join(','), 'one,Two,THREE,Four', 'detect camel 2');
		assert.strictEqual(Mangler.tokenize('OneTwoThree').join(','), 'One,Two,Three', 'detect title');

		// Forced source
		assert.strictEqual(Mangler.tokenize('one.two_three#four', '#').join(','), 'one.two_three,four', 'forced delimiter');
		assert.strictEqual(Mangler.tokenize('oneTwo.threeFour', 'camel').join(','), 'one,Two.three,Four', 'forced camel/title');
		assert.strictEqual(Mangler.tokenize('test.one[12].a', 'path').join(','), 'test,one,12,a', 'forced path');
	});

	QUnit.test('Mangler.each', function(assert) {
		assert.expect(3);

		var result;

		// Mangler object
		result = '';
		Mangler.each(Mangler(['A', 'B', 'C']), function(k, v) {
			result += v;
		});
		assert.strictEqual(result, 'ABC', 'Mangler');

		// Array
		result = '';
		Mangler.each(['A', 'B', 'C'], function(k, v) {
			result += v;
		});
		assert.strictEqual(result, 'ABC', 'array');

		// Object
		result = '';
		Mangler.each({ a: 1, b: 2, c: 3 }, function(k, v) {
			result += '' + k + v;
		});
		assert.strictEqual(result, 'a1b2c3', 'object');
	});

	// TODO: explore

	// TODO: extract

	// TODO: filter

	// TODO: find

	// TODO: findOne

	QUnit.test('Mangler.first', function(assert) {
		assert.expect(4);

		assert.strictEqual(Mangler.first(['A', 'B', 'C']), 'A', 'string array');
		assert.strictEqual(Mangler.first(['A', 'B', 'C'], /B/), 'B', 'string array with filter');

		var o = [
			{ id: 0, val: 4 },
			{ id: 1, val: 5 },
			{ id: 2, val: 6 }
		];

		assert.deepEqual(Mangler.first(o, { val: { $gte: 5 } }), { id: 1, val: 5 }, 'object array with cond');
		assert.deepEqual(Mangler.first(Mangler.index(o, 'id'), { val: { $gte: 5 } }), { id: 1, val: 5 }, 'iterate object properties with filter');
	});

	QUnit.test('Mangler.index', function(assert) {
		assert.expect(7);

		var o = [
			{ id: 0, data: 'a' },
			{ id: 1, data: 'b' },
			{ id: 2, data: 'c' }
		];

		assert.deepEqual(Mangler.index(o, 'id'), {
			'0': { id: 0, data: 'a' },
			'1': { id: 1, data: 'b' },
			'2': { id: 2, data: 'c' }
		}, 'number field generator');

		assert.deepEqual(Mangler.index(o, 'data'), {
			'a': { id: 0, data: 'a' },
			'b': { id: 1, data: 'b' },
			'c': { id: 2, data: 'c' }
		}, 'string field generator');

		assert.deepEqual(Mangler.index(o, ['id', 'data']), {
			'0|a': { id: 0, data: 'a' },
			'1|b': { id: 1, data: 'b' },
			'2|c': { id: 2, data: 'c' }
		}, 'array generator');

		assert.deepEqual(Mangler.index(o, ['id', 'data'], '#'), {
			'0#a': { id: 0, data: 'a' },
			'1#b': { id: 1, data: 'b' },
			'2#c': { id: 2, data: 'c' }
		}, 'array generator with delimiter');

		assert.deepEqual(Mangler.index(o, function(i, v) {
			return '' + i + ',' + (v.id * 2) + ',' + v.data;
		}), {
			'0,0,a': { id: 0, data: 'a' },
			'1,2,b': { id: 1, data: 'b' },
			'2,4,c': { id: 2, data: 'c' }
		}, 'function generator');

		o = [
			{ id: 0, data: 'a', deep: { arr: [2, 3, 4] } },
			{ id: 1, data: 'b', deep: { arr: [3, 4, 5] } },
			{ id: 2, data: 'c', deep: { arr: [4, 5, 6] } }
		];

		assert.deepEqual(Mangler.index(o, 'deep.arr[1]'), {
			'3': { id: 0, data: 'a', deep: { arr: [2, 3, 4] } },
			'4': { id: 1, data: 'b', deep: { arr: [3, 4, 5] } },
			'5': { id: 2, data: 'c', deep: { arr: [4, 5, 6] } }
		}, 'path generator');

		assert.deepEqual(Mangler.index(o, ['deep.arr[0]', 'deep.arr[1]', 'deep.arr[2]']), {
			'2|3|4': { id: 0, data: 'a', deep: { arr: [2, 3, 4] } },
			'3|4|5': { id: 1, data: 'b', deep: { arr: [3, 4, 5] } },
			'4|5|6': { id: 2, data: 'c', deep: { arr: [4, 5, 6] } }
		}, 'path array generator');
	});

	QUnit.test('Mangler.last', function(assert) {
		assert.expect(4);

		assert.strictEqual(Mangler.last(['A', 'B', 'C']), 'C', 'string array');
		assert.strictEqual(Mangler.last(['A', 'B', 'C'], /B/), 'B', 'string array with filter');

		var o = [
			{ id: 0, val: 4 },
			{ id: 1, val: 5 },
			{ id: 2, val: 6 }
		];

		assert.deepEqual(Mangler.last(o, { val: { $gte: 5 } }), { id: 2, val: 6 }, 'object array with filter');
		assert.deepEqual(Mangler.last(Mangler.index(o, 'id'), { val: { $gte: 5 } }), { id: 2, val: 6 }, 'iterate object properties with filter');
	});

	QUnit.test('Mangler.deflate', function(assert) {
		assert.expect(4);

		var o = {
			one: {
				two: {
					three: 'value'
				}
			},
			arr: [1, 2, 3]
		};

		assert.deepEqual(Mangler.deflate([Mangler.clone(o)]), [o], 'return non-object argument as is');

		assert.deepEqual(Mangler.deflate(Mangler.clone(o)), {
			one_two_three: 'value',
			arr_0: 1,
			arr_1: 2,
			arr_2: 3
		}, 'complete flattening');

		assert.deepEqual(Mangler.deflate(Mangler.clone(o), { limit: 1 }), {
			one_two: {
				three: 'value'
			},
			arr_0: 1,
			arr_1: 2,
			arr_2: 3
		}, 'limit to 1 level');

		assert.deepEqual(Mangler.deflate(Mangler.clone(o), { limit: 1, transform: 'title' }), {
			OneTwo: {
				three: 'value'
			},
			Arr0: 1,
			Arr1: 2,
			Arr2: 3
		}, 'limit to 1 level with transform');
	});

	QUnit.test('Mangler.inflate', function(assert) {
		assert.expect(6);
		
		var o = {
			one_two_three: 'value',
			arr_0: 1,
			arr_1: 2,
			arr_2: 3
		};
		
		assert.deepEqual(Mangler.inflate([Mangler.clone(o)]), [o], 'return non-object argument as is');
		
		assert.deepEqual(Mangler.inflate(Mangler.clone(o)), {
			one: {
				two: {
					three: 'value'
				}
			},
			arr: [1, 2, 3]
		}, 'complete inflation');

		assert.deepEqual(Mangler.inflate(Mangler.clone(o), { limit: 1 }), {
			one_two: {
				three: 'value'
			},
			arr: [1, 2, 3]
		}, 'complete inflation');

		assert.deepEqual(Mangler.inflate(Mangler.clone(o), { limit: 1, transform: 'title' }), {
			OneTwo: {
				Three: 'value'
			},
			Arr: [1, 2, 3]
		}, 'limit to 1 level with transform');

		o = {
			'one#two#three': 'value',
			'arr#0': 1,
			'arr#1': 2,
			'arr#2': 3
		};
		
		assert.deepEqual(Mangler.inflate(Mangler.clone(o)), o, 'unrecognized format, no changes');

		assert.deepEqual(Mangler.inflate(Mangler.clone(o), { from: '#' }), {
			one: {
				two: {
					three: 'value'
				}
			},
			arr: [1, 2, 3]
		}, 'force source conversion');
	});

	// TODO: get

	// TODO: getPath

	// TODO: merge

	// TODO: aggregate

	QUnit.module('Instance');

})(this);
