import {styleText} from 'node:util';
import TestaBase from './base.js';
import TestaContext from './context.js';

/**
* Main Test wrapper
*/
export class Testa {
	// Chainable state - id(String), location(file:String, line:Number), handler(Function), do(Function), title(String), describe(String) {{{
	_description;


	_id;


	/**
	* Set the short, unique ID of a test
	* This is mainly used to refer to the test in greps or dependencies
	*
	* @param {String} id The new ID to set
	* @returns {Testa} This chainable instance
	*/
	id(id, ...args) {
		this._id = id;
		return this.argsHandler(args);
	}


	_location = `(Unknown #${TestaBase.testNumber++})`;
	_locationFile;
	_locationLine;


	location(file, line, ...args) {
		this._locationFile = file;
		this._locationLine = line;
		this._location =
			file && line ? `${file} +${line}`
			: file ? file
			: '(Unknown Location)';

		return this.argsHandler(args);
	}


	_handler;


	handler(cb, ...args) {
		this._handler = cb;
		return this.argsDeny(args);
	}


	do(cb, ...args) {
		this._handler = cb;
		return this.argsHandler(args);
	}


	_title;


	title(title, ...args) {
		this._title = title;
		return this.argsHandler(args);
	}


	describe(description, ...args) {
		this._description = description;
		return this.argsHandler(args);
	}
	// }}}

	// Flow - skip(), priority(String|Number), depends(...String) {{{
	_skip = false;


	skip(...args) {
		this._skip = true;
		return this.argsTitleHandler(args);
	}


	_priority;


	priority(level, ...args) {
		this._priority = level;
		return this.argsTitleHandler(args);
	}


	_depends;


	depends(...args) {
		if (!args.every(a => typeof a == 'string')) throw new Error('All arguments to Testa.depends() must be string IDs');
		this._depends = [...(this._depends || []), ...args];
		return this;
	}
	// }}}

	// Timing and state - slow(Number|String), timeout(Number|String) {{{
	/**
	* The amount of time before a test is considered slow to resolve
	* Can be any valid timestring
	* If unspecified this inherits from TestaBase.testDefaults._slow
	*
	* @type {Number|String}
	*/
	_slow;


	/**
	* Set the amount of time before a test is considered slow to resolve
	* Can be any valid timestring
	*
	* @param {Number|String} timestring Either the time in milliseconds or any parsable timestring
	* @returns {Testa} This chainable instance
	*/
	slow(id, ...args) {
		this._slow = id;
		return this.argsHandler(args);
	}


	/**
	* The amount of time before a test times out
	* Can be any valid timestring
	* If unspecified this inherits from TestaBase.testDefaults._timeout
	*
	* @type {Number|String}
	*/
	_timeout;


	/**
	* Set the amount of time before a test times out
	* Can be any valid timestring
	*
	* @param {Number|String} timestring Either the time in milliseconds or any parsable timestring
	* @returns {Testa} This chainable instance
	*/
	timeout(id, ...args) {
		this._timeout = id;
		return this.argsHandler(args);
	}
	// }}}


	/**
	* Execute the test
	*
	* @returns {Promise} A promise wrapper for the test
	*/
	run() {
		if (this._skip) {
			// FIXME: Handle skip reporting
			return Promise.resolve();
		} else {
			let context = new TestaContext({
				test: this,
			});

			return Promise.resolve()
				.then(()=> { // Pre-flight checks
					if (!this._handler) throw new Error('Test has no handler function');
				})
				.then(()=> this._handler.call(context, context))
				.catch(e => {
					console.warn(
						styleText(['bold', 'blue'], `[TESTA ${this._title || this._id || this._location}]`),
						styleText(['bold', 'red'], 'ERR'),
						e,
					);
					throw e;
				})
		}
	}


	toString() {
		return this._title || this._id || this._location;
	}


	// Arg processing - argsDeny() + argsHandler() {{{
	/**
	* Refuse any more arguments
	* This is used for functions like `handler(...)` to prevent accidental misuse by passing too many operands to functions that dont accpet them
	*
	* @param {Array<*>} args Function arguments to examine
	* @returns {Testa} This chainable instance
	*/
	argsDeny(args) {
		if (args.length > 0) {
			throw new Error('Too many arguments passed');
		}
		return this;
	}


	/**
	* Accept exactly one more argument - if its specified populate the handler as long as its not already been set
	* This is to allow shorthand usage for things like `test.skip(...)` or `test.id('My ID', ...)`
	*
	* @param {Array<*>} args Function arguments to examine
	* @returns {Testa} This chainable instance
	*/
	argsHandler(args) {
		if (!args[0]) { // No payload
			// Pass
		} else if (args.length > 1) {
			throw new Error('Only one optional operand is allowed - the function handler');
		} else if (typeof args[0] == 'function') {
			this.handler(args[0]);
		} else {
			throw new Error('Dont know how to chain non-function payload!');
		}
		return this;
	}


	/**
	* Accept possibly two arguments - a title and a handler function
	* This is the base functionality of the `test()` function by itself but can be used by some other functions like `before()`, `after()` etc.
	*
	* @param {Array<*>} args Function arguments to examine
	* @returns {Testa} This chainable instance
	*/
	argsTitleHandler(args) {
		if (!args[0]) { // No payload
			// Pass
		} else if (args.length > 2) {
			throw new Error('Only two optional operands are allowed - an optional title + a function handler');
		} else if (typeof args[0] == 'string' && typeof args[1] == 'function') {
			this.id(args[0]).handler(args[1]);
		} else if (typeof args[0] == 'function') {
			this.handler(args[0]);
		} else {
			throw new Error('Dont know how to chain non-function payload!');
		}
		return this;
	}
	// }}}
}

export function test(title, handler) {
	// Argument munging {{{
	if (!title && !handler) {
		// Pass
	} else if (typeof title == 'string' && typeof handler == 'function') {
		// Pass
	} else if (typeof title == 'function' && !handler) {
		[title, handler] = ['unnamed', title];
	} else {
		throw new Error(`Unknown call signature for test(title:String, handler:Function) - got (${typeof title}, ${typeof handler})`);
	}
	// }}}

	let testa = new Testa();
	if (title) testa.title(title);
	if (handler) testa.handler(handler);

	TestaBase.queue(testa);
	return testa;
}

// Allow test.THING() to map to test() while setting that as a flag
// e.g. 'test.skip(title, handler)' -> `new Testa.title(title).handler(handler).skip()`
[
	'id',
	'location',
	'handler',
	'do',
	'title',
	'skip',
	'priority',
	'depends',
]
	.forEach(f =>
		test[f] = (...args) => test()[f](...args)
	);

// Setup before(), after() aliases {{{
test.before = (...args) => test().priority('BEFORE', ...args);
export let before = test.before;

test.after = (...args) => test().priority('AFTER', ...args);
export let after = test.after;
// }}}

export {expect} from 'chai';
