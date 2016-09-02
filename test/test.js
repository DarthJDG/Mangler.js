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
(function(global, undefined) {

	QUnit.module('Global');

	QUnit.test('Mangler', function(assert) {
		assert.expect(4);

		assert.deepEqual(Mangler().items, [], 'empty object');
		assert.deepEqual(Mangler([]).items, [], 'empty array init');
		assert.deepEqual(Mangler(1).items, [1], 'single item init');
		assert.deepEqual(Mangler([1, 2, 3]).items, [1, 2, 3], 'array init');
	});

	QUnit.module('Utility');

	QUnit.test('Mangler.registerType, Mangler.mergeType, Mangler.removeType', function(assert) {
		assert.expect(7);

		function MyObject() { }

		var o = new MyObject();

		assert.strictEqual(typeof Mangler.get(o, 'a'), 'undefined', 'not registered, get fails');

		Mangler.registerType(MyObject, {
			get: function(obj, k) {
				if(k === 'a') return 1;
			}
		});

		assert.strictEqual(Mangler.get(o, 'a'), 1, 'registered, got value');

		var result = '';
		Mangler.each(o, function(k, v) { result += v; });
		assert.strictEqual(result, '', 'no iterator yet, fail');

		Mangler.mergeType(MyObject, {
			each: function(obj, callback) {
				if(callback(0, 'A') === false) return;
				if(callback(1, 'B') === false) return;
				if(callback(2, 'C') === false) return;
			}
		});

		result = '';
		Mangler.each(o, function(k, v) { result += v; });
		assert.strictEqual(result, 'ABC', 'iterator merged, ok');
		assert.strictEqual(Mangler.get(o, 'a'), 1, 'get is still registered');

		Mangler.removeType(MyObject);

		result = '';
		Mangler.each(o, function(k, v) { result += v; });
		assert.strictEqual(result, '', 'unregistered');
		assert.strictEqual(typeof Mangler.get(o, 'a'), 'undefined', 'unregistered');
	});

	QUnit.test('Mangler.compareType', function(assert) {
		assert.expect(9);

		assert.ok(Mangler.compareType('A', 'A'), 'strict equal');
		assert.ok(Mangler.compareType(null, null), 'null == null');
		assert.ok(Mangler.compareType(1, 2), 'number');
		assert.ok(Mangler.compareType('A', 'B'), 'string');
		assert.ok(Mangler.compareType(new Date(), Date), 'Date');
		assert.ok(Mangler.compareType(function(){}, Function), 'function');
		assert.ok(!Mangler.compareType(function(){}, function(){}), 'two functions');
		assert.ok(Mangler.compareType({}, Object), 'object');
		assert.ok(Mangler.compareType([], Array), 'array');
	});

	QUnit.test('Mangler.getIterator', function(assert) {
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

	QUnit.module('Static');

	QUnit.test('Mangler.test', function(assert) {
		assert.expect(165);

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

		// $elemMatch operator
		assert.ok(Mangler.test([{ a: 1 }, { a: 2 }], { $elemMatch: { a: 2 }}), '$elemMatch pass');
		assert.ok(!Mangler.test([{ a: 1 }, { a: 2 }], { $elemMatch: { a: 3 }}), '$elemMatch fail');

		// $in operator
		assert.ok(Mangler.test([1, 2], { $in: [1] }), '$in: 2 in 1 with match');
		assert.ok(Mangler.test([1, 2], { $in: [1, 2] }), '$in: 2 matching sets');
		assert.ok(Mangler.test([1, 2], { $in: [1, 3] }), '$in: 2 in 2 with 1 match');
		assert.ok(!Mangler.test([1, 2], { $in: [4] }), '$in: 2 in 1 with no match');
		assert.ok(Mangler.test(1, { $in: [1, 2, 3] }), '$in: value matches');
		assert.ok(!Mangler.test(4, { $in: [1, 2, 3] }), '$in: value does not match');

		// $nin operator
		assert.ok(!Mangler.test([1, 2], { $nin: [1] }), '$nin: 2 in 1 with match');
		assert.ok(!Mangler.test([1, 2], { $nin: [1, 2] }), '$nin: 2 matching sets');
		assert.ok(!Mangler.test([1, 2], { $nin: [1, 3] }), '$nin: 2 in 2 with 1 match');
		assert.ok(Mangler.test([1, 2], { $nin: [4] }), '$nin: 2 in 1 with no match');
		assert.ok(!Mangler.test(1, { $nin: [1, 2, 3] }), '$nin: value matches');
		assert.ok(Mangler.test(4, { $nin: [1, 2, 3] }), '$nin: value does not match');

		// $not operator
		assert.ok(!Mangler.test(2, { $not: { $gt: 1, $lt: 3 } }), '$not implicit and: both true');
		assert.ok(Mangler.test(2, { $not: { $eq: 2, $lt: 2 } }), '$not implicit and: one true');
		assert.ok(Mangler.test(2, { $not: { $lt: 2, $gt: 2 } }), '$not implicit and: none true');

		// $nor operator
		assert.ok(!Mangler.test(2, { $nor: [{ $gt: 1 }, { $lt: 3 }] }), '$nor: both true');
		assert.ok(!Mangler.test(2, { $nor: [{ $eq: 2 }, { $lt: 2 }] }), '$nor: one true');
		assert.ok(Mangler.test(2, { $nor: [{ $lt: 2 }, { $gt: 2 }] }), '$nor: none true');

		// $exists operator
		assert.ok(Mangler.test({ a: 1 }, { a: { $exists: true } }), '$exists: check if exists (true)');
		assert.ok(!Mangler.test({ a: 1 }, { a: { $exists: false } }), '$exists: check if does not exist (false)');
		assert.ok(!Mangler.test({ a: 1 }, { b: { $exists: true } }), '$exists: check if exists (false)');
		assert.ok(Mangler.test({ a: 1 }, { b: { $exists: false } }), '$exists: check if does not exist (true)');

		// $type operator
		assert.ok(Mangler.test('A', { $type: 'A' }), '$type: strict equal');
		assert.ok(Mangler.test(null, { $type: null }), '$type: null == null');
		assert.ok(Mangler.test(1, { $type: 2 }), '$type: number');
		assert.ok(Mangler.test('A', { $type: 'B' }), '$type: string');
		assert.ok(Mangler.test(new Date(), { $type: Date }), '$type: Date');
		assert.ok(Mangler.test(function(){}, { $type: Function }), '$type: function');
		assert.ok(!Mangler.test(function(){}, { $type: function(){} }), '$type: two functions');
		assert.ok(Mangler.test({}, { $type: Object }), '$type: object');
		assert.ok(Mangler.test([], { $type: Array }), '$type: array');

		// $mod operator
		assert.ok(Mangler.test(4, { $mod: [2, 0] }), '$mod: divisible by 2 (true)');
		assert.ok(Mangler.test(5, { $mod: [2, 1] }), '$mod: remainder = 1 (true)');
		assert.ok(!Mangler.test(5, { $mod: [2, 0] }), '$mod: divisible by 2 (false)');
		assert.ok(!Mangler.test(4, { $mod: [2, 1] }), '$mod: remainder = 1 (false)');

		// $where operator
		assert.ok(Mangler.test({ a: 'ABC' }, { $where: function(obj) { return obj.a === 'ABC' }}), '$where test');

		// literal check
		assert.ok(Mangler.test({ a: 1, b: 'A' }, { a: 1, b: 'A' }), 'literal: identity');
		assert.ok(Mangler.test({ a: 1, b: 'A' }, { a: 1 }), 'literal: true (number)');
		assert.ok(Mangler.test({ a: 1, b: 'A' }, { b: 'A' }), 'literal: true (string)');
		assert.ok(!Mangler.test({ a: 1, b: 'A' }, { a: 2 }), 'literal: false');
		assert.ok(Mangler.test({ a: 1, b: 'A', c: 3 }, { a: 1, b: 'A' }), 'literal: multiple matches');
		assert.ok(!Mangler.test({ a: 1, b: 'A' }, { a: 1, b: 'B' }), 'literal: one match, one fail');
		assert.ok(Mangler.test({ a: 1, b: 'ABC' }, { b: /^A./ }), 'literal: regex pass');
		assert.ok(!Mangler.test({ a: 1, b: 'ABC' }, { b: /^B./ }), 'literal: regex fail');
		assert.ok(Mangler.test({ a: 1, b: { c: 'A' } }, { a: 1, 'b.c': 'A' }), 'literal: path test');
		assert.ok(Mangler.test({ a: 1, b: { c: 'A' } }, { a: 1, b: { c: 'A' } }), 'literal: nest test');
		assert.ok(Mangler.test({ a: 1, b: [{ c: 'A' }, { c: 'B' }] }, { a: 1, b: { c: 'A' } }), 'literal: nest array test pass');
		assert.ok(!Mangler.test({ a: 1, b: [{ c: 'A' }, { c: 'B' }] }, { a: 1, b: { c: 'C' } }), 'literal: nest array test fail');

		// implicit $all operator
		assert.ok(Mangler.test([1, 2, 3], [1]), 'implicit $all: 1 out of 3');
		assert.ok(Mangler.test([1, 2, 3], [1, 2]), 'implicit $all: 2 out of 3');
		assert.ok(Mangler.test([1, 2, 3], [1, 2, 3]), 'implicit $all: 3 out of 3');
		assert.ok(!Mangler.test([1, 2, 3], [1, 2, 3, 4]), 'implicit $all: 1 extra');

		// implicit $where operator
		assert.ok(Mangler.test({ a: 'ABC' }, function(obj) { return obj.a === 'ABC' }), 'implicit $where test');

		// implicit $elemMatch
		assert.ok(Mangler.test([{ a: 1 }, { a: 2 }], { a: 2 }), 'implicit $elemMatch pass');
		assert.ok(!Mangler.test([{ a: 1 }, { a: 2 }], { a: 3 }), 'implicit $elemMatch fail');
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

	QUnit.test('Mangler.explore', function(assert) {
		assert.expect(2);

		var data = [
			{ child: {}	},
			{ children: [{}, {}] }
		];

		Mangler.explore(data, function(key, value, state) {
		if(Mangler.isObject(value)) {
			if(state.$parentPath !== state.path) {
				// There was a change in parent path, increase depth
				// It makes sure we don't increase depth for every sibling
				state.path = state.$parentPath;
				state.depth++;
			}
				value.depth = state.depth;
			}
		}, { depth: 0 });

		assert.deepEqual(data, [
			{ depth: 1, child: { depth: 2 } },
			{ depth: 1, children: [{ depth: 2 }, { depth: 2 }] }
		], 'example 1');

		data = {
			companies: [
				{
					name: 'Test Company',
					manager: { name: 'Mr Smith' },
					sales: [
						{ name: 'John' },
						{ name: 'Jack' }
					],
					engineers: [
						{ name: 'Fred' },
						{ name: 'Barney' }
					]
				},
				{
					name: 'Another Co',
					manager: { name: 'Mr Jackson' },
					sales: [
						{ name: 'Bill' }
					],
					marketing: [
						{ name: 'Mark' },
						{ name: 'Rob' }
					]
				}
			]
		};

		Mangler.explore(data, function(k, v, state) {
			if(v.manager) {
				// This is a company, add company name to manager
				v.manager.company = v.name;

				// Reset counter
				v.manager.supervises = 0;

				// Add manager to state object
				state.manager = v.manager;
			} else if(v.name && k !== 'manager') {
				// It has a name and not the manager, must be another employee
				state.manager.supervises += 1;
			}
		});

		assert.deepEqual(Mangler.extract(data, 'manager'), [
			{ company: 'Test Company', name: 'Mr Smith', supervises: 4 },
			{ company: 'Another Co', name: 'Mr Jackson', supervises: 3 }
		], 'example 2');
	});

	QUnit.test('Mangler.extract', function(assert) {
		assert.expect(8);

		var data = {
			mobile_os: [
				{ id: "001", name: "Android" },
				{ id: "002", name: "iOS" }
			],
			desktop_os: [
				{ id: "003", name: "Windows" },
				{ id: "004", name: "Linux", sub_os: [
					{ id: "005", name: "CentOS" },
					{ id: "006", name: "Ubuntu" }
				]}
			]
		};

		assert.deepEqual(Mangler.extract(data, 'mobile_os'), [
			{ id: "001", name: "Android" },
			{ id: "002", name: "iOS" }
		], 'example 1');

		assert.deepEqual(Mangler.extract(data, 'name'), ["Android", "iOS", "Windows", "Linux", "CentOS", "Ubuntu"], 'example 2');
		assert.deepEqual(Mangler.extract(data, 'mobile_os[].name'), ["Android", "iOS"], 'example 3');
		assert.deepEqual(Mangler.extract(data, 'desktop_os[1].sub_os[].name'), ["CentOS", "Ubuntu"], 'example 4');
		assert.deepEqual(Mangler.extract(data, 'desktop_os.*.name'), ["Windows", "Linux", "CentOS", "Ubuntu"], 'example 5');

		assert.deepEqual(Mangler.extract(data, '?_os'), [
			{ id: "001", name: "Android" },
			{ id: "002", name: "iOS" },
			{ id: "003", name: "Windows" },
			{ id: "004", name: "Linux", sub_os: [
				{ id: "005", name: "CentOS" },
				{ id: "006", name: "Ubuntu" }
			]}
		], 'example 6');

		assert.deepEqual(Mangler.extract(data, '?_os', { drilldown: true }), [
			{ id: "001", name: "Android" },
			{ id: "002", name: "iOS" },
			{ id: "003", name: "Windows" },
			{ id: "004", name: "Linux", sub_os: [
				{ id: "005", name: "CentOS" },
				{ id: "006", name: "Ubuntu" }
			]},
			{ id: "005", name: "CentOS" },
			{ id: "006", name: "Ubuntu" }
		], 'example 7');

		data = {
			manager: { name: 'John' },
			employees: [
				{ name: 'Fred' },
				{ name: 'Bill' }
			]
		};

		assert.deepEqual(Mangler.extract(data, 'manager|employees', { key: true, prop: true }), [
			{ name: 'John', key: 'manager', prop: 'manager' },
			{ name: 'Fred', key: 0, prop: 'employees' },
			{ name: 'Bill', key: 1, prop: 'employees' }
		], 'example 8');
	});

	QUnit.test('Mangler.filter', function(assert) {
		assert.expect(8);

		var o1, o2;

		assert.deepEqual(o1 = Mangler.filter(o2 = [1, 2, 3]), [], 'array: no argument, clear');
		assert.ok(o1 === o2, 'reference check');
		assert.deepEqual(o1 = Mangler.filter(o2 = [1, 2, 3], { $gte: 2 }), [2, 3], 'array: filter');
		assert.ok(o1 === o2, 'reference check');
		assert.deepEqual(o1 = Mangler.filter(o2 = { a: 1, b: 2, c: 3 }), {}, 'object: no argument, clear');
		assert.ok(o1 === o2, 'reference check');
		assert.deepEqual(o1 = Mangler.filter(o2 = { a: 1, b: 2, c: 3 }, { $gte: 2 }), { b: 2, c: 3 }, 'object: filter');
		assert.ok(o1 === o2, 'reference check');
	});

	QUnit.test('Mangler.find', function(assert) {
		assert.expect(4);

		var a = [
			{ type: 'fruit', name: 'apple', price: 1 },
			{ type: 'vegetable', name: 'carrot', price: 2 },
			{ type: 'fruit', name: 'cherry', price: 3 },
			{ type: 'fruit', name: 'orange', price: 4 },
			{ type: 'vegetable', name: 'peas', price: 5 }
		];

		assert.deepEqual(Mangler.find(a), [], 'no condition, no results');
		assert.deepEqual(Mangler.find(a, {}), a, 'empty condition, return all');
		assert.deepEqual(Mangler.find(a, { price: 3 }), [a[2]], 'one result');
		assert.deepEqual(Mangler.find(a, { type: 'fruit' }), [a[0], a[2], a[3]], 'multiple results');
	});

	QUnit.test('Mangler.findOne', function(assert) {
		assert.expect(4);

		assert.strictEqual(Mangler.findOne(['A', 'B', 'C']), 'A', 'string array');
		assert.strictEqual(Mangler.findOne(['A', 'B', 'C'], /B/), 'B', 'string array with filter');

		var o = [
			{ id: 0, val: 4 },
			{ id: 1, val: 5 },
			{ id: 2, val: 6 }
		];

		assert.deepEqual(Mangler.findOne(o, { val: { $gte: 5 } }), { id: 1, val: 5 }, 'object array with cond');
		assert.deepEqual(Mangler.findOne(Mangler.index(o, 'id'), { val: { $gte: 5 } }), { id: 1, val: 5 }, 'iterate object properties with filter');
	});

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

	QUnit.test('Mangler.get', function(assert) {
		assert.expect(5);

		var o = {
			a: { b: 1 },
			'a.b': 2,
			c: 3
		};

		assert.strictEqual(Mangler.get([1, 2, 3], 1), 2, 'get array element');
		assert.strictEqual(Mangler.get(Mangler([1, 2, 3]), 1), 2, 'Mangler object item');
		assert.strictEqual(Mangler.get(o, 'c'), 3, 'object property');
		assert.strictEqual(Mangler.get(o, 'a.b'), 2, 'object property with dot');
		assert.deepEqual(Mangler.get(o, 'a'), { b: 1 }, 'get object');
	});

	QUnit.test('Mangler.getPath', function(assert) {
		assert.expect(7);

		var o = {
			a: { b: 1 },
			'a.b': 2,
			c: 3,
			d: { e: [4, 5, 6] }
		};

		assert.ok(typeof Mangler.getPath([1, 2, 3], 1) === 'undefined', 'non-string path');
		assert.strictEqual(Mangler.getPath([1, 2, 3], '[1]'), 2, 'get array element');
		assert.strictEqual(Mangler.getPath(Mangler([1, 2, 3]), '1'), 2, 'Mangler object item');
		assert.strictEqual(Mangler.getPath(o, 'c'), 3, 'object property');
		assert.strictEqual(Mangler.getPath(o, 'a.b'), 1, 'object property path');
		assert.deepEqual(Mangler.getPath(o, 'a'), { b: 1 }, 'get object');
		assert.deepEqual(Mangler.getPath(o, 'd.e[1]'), 5, 'path test');
	});

	QUnit.test('Mangler.merge', function(assert) {
		assert.expect(11);

		var o1, o2;

		assert.deepEqual(o2 = Mangler.merge(o1 = { a: 1 }, { b: 2 }), { a: 1, b: 2 }, 'merge two objects');
		assert.ok(o1 === o2, 'reference check');
		assert.deepEqual(o2 = Mangler.merge(o1 = { a: 1 }, [{ b: 2 }, { c: 3 }]), { a: 1, b: 2, c: 3 }, 'merge array into object');
		assert.ok(o1 === o2, 'reference check');
		assert.deepEqual(o2 = Mangler.merge([o1 = { a: 1 }, { b: 2 }], [{ c: 3 }, { d: 4 }]), [{ a: 1, c: 3 }, { b: 2, d: 4 }], 'merge two arrays');
		assert.ok(o1 === o2[0], 'reference check');
		assert.deepEqual(o2 = Mangler.merge([o1 = { a: 1 }, { b: 2 }], { c: 3 }), [{ a: 1, c: 3 }, { b: 2, c: 3 }], 'merge object into array');
		assert.ok(o1 === o2[0], 'reference check');
		assert.strictEqual(Mangler.merge('A'), 'A', 'invalid argument');
		assert.deepEqual(Mangler.merge({}, null), {}, 'invalid argument');
		assert.strictEqual(typeof Mangler.merge(), 'undefined', 'no arguments');
	});

	QUnit.test('Mangler.aggregate', function(assert) {
		assert.expect(17);

		var o = { a: 1, b: 2, c: 3 };
		var a = [2, 3, 4];

		assert.strictEqual(Mangler.aggregate(a, 'sum'), 9, 'built in: sum');
		assert.strictEqual(Mangler.aggregate(a, 'mul'), 24, 'built in: mul');
		assert.strictEqual(Mangler.aggregate(a, 'avg'), 3, 'built in: avg');
		assert.strictEqual(Mangler.aggregate(a, 'cnt'), 3, 'built in: cnt');
		assert.strictEqual(Mangler.aggregate(a, 'min'), 2, 'built in: min');
		assert.strictEqual(Mangler.aggregate(a, 'max'), 4, 'built in: max');
		assert.deepEqual(Mangler.aggregate(o, 'array'), [1, 2, 3], 'built in: array');
		assert.strictEqual(Mangler.aggregate(a, '+'), 9, 'built in: +');
		assert.strictEqual(Mangler.aggregate(a, '*'), 24, 'built in: *');
		assert.strictEqual(Mangler.aggregate(a, '<'), 2, 'built in: <');
		assert.strictEqual(Mangler.aggregate(a, '>'), 4, 'built in: >');
		assert.deepEqual(Mangler.aggregate(o, '[]'), [1, 2, 3], 'built in: []');
		assert.strictEqual(Mangler.aggregate(a, 'add'), 9, 'built in: add');
		assert.strictEqual(Mangler.aggregate(a, 'count'), 3, 'built in: count');

		assert.strictEqual(Mangler.aggregate([3, 2, 1, 0], function(k, v, a) {
			if(a.count == 1) a.result = '';
			a.result += v;
		}, {
			value: function(v) {
				return Math.pow(2, v);
			}
		}), '8421', 'custom with value function');

		a = [
			{ type: 'fruit', name: 'apple', price: 1 },
			{ type: 'vegetable', name: 'carrot', price: 2 },
			{ type: 'fruit', name: 'cherry', price: 3 },
			{ type: 'fruit', name: 'orange', price: 4 },
			{ type: 'vegetable', name: 'peas', price: 5 }
		];

		assert.deepEqual(Mangler.aggregate(a, '+', {
			value: 'price',
			group: 'type'
		}), {
			fruit: 8,
			vegetable: 7
		}, 'custom with value and group path');

		assert.deepEqual(Mangler.aggregate(a, '+', {
			value: 'price',
			group: function(k, v) {
				return v.type.toUpperCase();
			}
		}), {
			FRUIT: 8,
			VEGETABLE: 7
		}, 'custom with value path and group function');
	});

	// Most instance methods need only a short test, as they're simply calling one of the static methods
	// on the Mangler object's own items collection.

	QUnit.module('Instance');

	QUnit.test('.add', function(assert) {
		assert.expect(4);

		var m = Mangler();

		assert.deepEqual(m.add(1).items, [1], 'add single item');
		assert.deepEqual(m.add([2, 3]).items, [1, 2, 3], 'add multiple items');
		assert.deepEqual(m.add([]).items, [1, 2, 3], 'add nothing');
		assert.deepEqual(m.add().items, [1, 2, 3], 'add nothing');
	});

	QUnit.test('.aggregate', function(assert) {
		assert.strictEqual(Mangler([1, 2, 3]).aggregate('+'), 6, 'passed');
	});

	QUnit.test('.clear', function(assert) {
		assert.deepEqual(Mangler([1, 2, 3]).clear().items, [], 'passed');
	});

	QUnit.test('.clone', function(assert) {
		assert.expect(2);

		var m1 = Mangler([{ a: 1 }]);
		var m2 = m1.clone();

		assert.deepEqual(m1.items, m2.items, 'same contents');
		assert.notStrictEqual(m1.items[0], m2.items[0], 'reference check');
	});

	QUnit.test('.copy', function(assert) {
		assert.expect(2);

		var m1 = Mangler([{ a: 1 }]);
		var m2 = m1.copy();

		assert.deepEqual(m1.items, m2.items, 'same contents');
		assert.strictEqual(m1.items[0], m2.items[0], 'reference check');
	});

	QUnit.test('.deflate', function(assert) {
		var m = Mangler([{ a: { b: 1 } }, { c: { d: 2 } }]).deflate();
		assert.deepEqual(m.items, [{ a_b: 1 }, { c_d: 2 }], 'passed');
	});

	QUnit.test('.each', function(assert) {
		var result = '';
		Mangler(['A', 'B', 'C']).each(function(k, v) { result += v });
		assert.strictEqual(result, 'ABC', 'passed');
	});

	QUnit.test('.explore', function(assert) {
		var result = '';
		Mangler([{ a: 'A' }, { b: 'B' }, { c: 'C' }]).explore(function(k, v, state) {
			if(typeof v === 'string') result += state.$path + v;
		});
		assert.strictEqual(result, '[0].aA[1].bB[2].cC', 'passed');
	});

	QUnit.test('.filter', function(assert) {
		assert.deepEqual(Mangler([1, 2, 3]).filter({ $ne: 2 }).items, [1, 3], 'passed');
	});

	QUnit.test('.find', function(assert) {
		assert.deepEqual(Mangler([1, 2, 3]).find({ $lt: 3 }), [1, 2], 'passed');
	});

	QUnit.test('.findOne', function(assert) {
		assert.strictEqual(Mangler([1, 2, 3]).findOne({ $lt: 3 }), 1, 'passed');
	});

	QUnit.test('.first', function(assert) {
		assert.strictEqual(Mangler([1, 2, 3]).first({ $lt: 3 }), 1, 'passed');
	});

	QUnit.test('.get', function(assert) {
		assert.strictEqual(Mangler([1, 2, 3]).get(1), 2, 'passed');
	});

	QUnit.test('.index', function(assert) {
		var data = [
			{ id: 'a' },
			{ id: 'b' },
			{ id: 'c' }
		];

		assert.deepEqual(Mangler(data).index('id'), {
			a: { id: 'a' },
			b: { id: 'b' },
			c: { id: 'c' }
		}, 'passed');
	});

	QUnit.test('.inflate', function(assert) {
		var m = Mangler([{ a_b: 1 }, { c_d: 2 }]).inflate();
		assert.deepEqual(m.items, [{ a: { b: 1 } }, { c: { d: 2 } }], 'passed');
	});

	QUnit.test('.last', function(assert) {
		assert.strictEqual(Mangler([1, 2, 3]).last({ $lt: 3 }), 2, 'passed');
	});

	QUnit.test('.limit', function(assert) {
		assert.expect(3);

		var a = [1, 2, 3, 4];

		assert.deepEqual(Mangler(a).limit(0).items, a, 'unlimited');
		assert.deepEqual(Mangler(a).limit(2).items, [1, 2], 'passed');
		assert.deepEqual(Mangler(a).limit(5).items, a, 'no change');
	});

	QUnit.test('.push', function(assert) {
		assert.expect(4);

		var m = Mangler();

		assert.deepEqual(m.push(1).items, [1], 'push single item');
		assert.deepEqual(m.push([2, 3]).items, [1, [2, 3]], 'push array');
		assert.deepEqual(m.push([]).items, [1, [2, 3], []], 'push empty array');
		assert.deepEqual(m.push().items, [1, [2, 3], []], 'push nothing');
	});

	QUnit.test('.remove', function(assert) {
		assert.expect(8);

		var m = Mangler(['A', 'B', 'C']);

		assert.strictEqual(m.remove('B'), true, 'passed');
		assert.deepEqual(m.items, ['A', 'C'], 'passed');
		assert.strictEqual(m.remove('D'), false, 'passed');
		assert.deepEqual(m.items, ['A', 'C'], 'passed');
		assert.strictEqual(m.remove('A'), true, 'passed');
		assert.deepEqual(m.items, ['C'], 'passed');
		assert.strictEqual(m.remove('C'), true, 'passed');
		assert.deepEqual(m.items, [], 'passed');
	});

	QUnit.test('.rename', function(assert) {
		assert.deepEqual(Mangler({ a: 1 }).rename({ a: 'b' }).items, [{ b: 1 }], 'passed');
	});

	QUnit.test('.test', function(assert) {
		assert.expect(2);

		var a = [{ a: 1 }, { b: 2 }, { c: 3 }];

		assert.ok(Mangler(a).test({ b: 2 }), 'true');
		assert.ok(!Mangler(a).test({ b: 3 }), 'false');
	});

	QUnit.test('.transform', function(assert) {
		assert.deepEqual(Mangler({ one_two: 1 }).transform({ to: 'title' }).items, [{ OneTwo: 1 }], 'passed');
	});

})(this);
