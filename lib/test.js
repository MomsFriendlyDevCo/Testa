import {styleText} from 'node:util';
import TestaBase from './base.js';
import TestaContext from './context.js';
import timestring from 'timestring';

/**
* Main Test class instance
*/
export default class TestaTest {

	// Basic state - id(String), location(file:String, line:Number), handler(Function), do(Function), title(String), describe(String) {{{
	_description;


	_id;


	/**
	* Set the short, unique ID of a test
	* This is mainly used to refer to the test in greps or dependencies
	*
	* @param {String} id The new ID to set
	* @param {*...} [args] Additional args passed to `argsHandler()`
	* @returns {TestaTest} This chainable instance
	*/
	id(id, ...args) {
		this._id = id;
		return this.argsHandler(args);
	}


	_location = `(Unknown #${TestaBase.testNumber++})`;
	_locationFile;
	_locationLine;


	/**
	* Specify the current test location
	*
	* @param {String} file The current test file location
	* @param {Number} line The relevent line number for the test
	* @param {*...} [args] Additional args passed to `argsHandler()`
	* @returns {TestaTest} This chainable instance
	*/
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

	// Flow - skip(), only(), priority(String|Number), depends(...String) {{{
	_skip = false;


	/**
	* Optional payload for a reason a test was skipped
	*
	* @type {String}
	*/
	_skipReason;



	skip(reason, ...args) {
		this._skip = true;
		this._skipReason = reason;
		return this.argsTitleHandler(args);
	}


	_only = false;


	only(...args) {
		this._only = true;
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

	// Timing - slow(Number|String), timeout(Number|String) {{{
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
	* @param {Number|String} timing Either the time in milliseconds or any parsable timestring
	* @param {*...} [args] Additional args passed to `argsHandler()`
	* @returns {TestaTest} This chainable instance
	*/
	slow(timing, ...args) {
		this._slow = timing;
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
	* @param {Number|String} timing Either the time in milliseconds or any parsable timestring
	* @param {*...} [args] Additional args passed to `argsHandler()`
	* @returns {TestaTest} This chainable instance
	*/
	timeout(timing, ...args) {
		this._timeout = timing;
		return this.argsHandler(args);
	}
	// }}}

	// Flow - run(), skip(reason:String), abort() {{{
	/**
	* The status of the current test
	*
	* @type {'idle'|'running'|'skipped'|'timeout'|'resolved'|'rejected'}
	*/
	_status = 'idle';


	/**
	* The rejected error payload, if any
	*/
	_error;


	/**
	* Execute the test
	*
	* @param {Object} [options] Additional options to mutate behaviour
	* @param {Function} [options.onLog] Function called as `(msg:Array<Any>)` with logging output
	* @param {Function} [options.onSkip] Function called as `(msg:Array<Any>)` when a test marks itself as skipped
	* @param {Function} [options.onSlow] Function to execute if the task exceeds its slowness timing
	* @param {Function} [options.onTimeout] Function to execute if the task exceeds its timeout and has been terminated
	*
	* @returns {Promise} A promise wrapper for the test
	*/
	run(options) {
		let settings = {
			/* eslint-disable no-unused-vars */
			onLog: msg => {},
			onSkip: msg => {},
			onSlow: ()=> {},
			onTimeout: ()=> {},
			...options,
		};
		if (this._status != 'idle') throw new Error(`Only idle tests can be told to run. Current status: "${this._status}"`);
		this._status = 'running';

		let context = new TestaContext({
			test: this,
			log: (...msg) => settings.onLog(msg),
			skip: (...msg) => {
				throw {SKIPPED: true, msg: msg.join(' ')};
			},
		});
		let slowTimer, timeoutTimer; // Eventual timer handles for slow + timeout

		return Promise.resolve()
			.then(()=> {
				if (this._skip) throw {SKIPPED: true, msg: this._skipReason};
			})
			.then(()=> { // Pre-flight checks
				if (!this._handler) throw new Error('Test has no handler function');

				// Calculate timings
				let slowMs = typeof this._slow == 'string' ? timestring(this._slow, 'ms') : this._slow;
				let timeoutMs = typeof this._timeout == 'string' ? timestring(this._timeout, 'ms') : this._timeout;

				// Set timers
				slowTimer = setTimeout(()=> settings.onSlow(this), slowMs);
				timeoutTimer = setTimeout(()=> {
					this._status = 'timeout';
					this._error = new Error('Timeout');
					this.abort();
					settings.onTimeout(this);
				}, timeoutMs);
			})
			.then(()=> this._handler.call(context, context))
			.then(()=> {
				// TODO: Do something with result returns?
				this._status = 'resolved';
			})
			.catch(e => {
				if (e?.SKIPPED) { // Test got skipped out - either directly or dynamically
					this._status = 'skipped';
					this._error = new Error('Test skipped');
					settings.onSkip(e.msg);
					// Eat error and continue as if resolved
				} else {
					this._status = 'rejected';
					this._error = e;
					console.warn(
						styleText(['bold', 'blue'], `[TESTA ${this._title || this._id || this._location}]`),
						styleText(['bold', 'red'], 'ERR'),
						e,
					);
					throw e;
				}
			})
			.finally(()=> {
				clearTimeout(slowTimer);
				clearTimeout(timeoutTimer);
			})
	}




	/**
	* Try to abort a running test
	*
	* @returns {TestaTest} This chainable instance
	*/
	abort() {
		// FIXME: Stub
		return this;
	}
	// }}}

	// Built-ins - toString() {{{

	/**
	* Try to compute the string representation of a test
	*
	* @param {'title'} type to compute the string representation
	* @returns {String} The closest match to the string that is computable
	*/
	toString(type) {
		switch (type) {
			case 'id':
				return this._id || '(No ID)';
			case 'id||location':
				return this._id || this._location;
			case 'title':
				return this._title || '(No title)';
			default:
				return this._title || this._id || this._location;
		}
	}
	// }}}

	// Arg processing - argsDeny() + argsHandler() {{{
	/**
	* Refuse any more arguments
	* This is used for functions like `handler(...)` to prevent accidental misuse by passing too many operands to functions that dont accpet them
	*
	* @param {Array<*>} args Function arguments to examine
	* @returns {TestaTest} This chainable instance
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
	* @returns {TestaTest} This chainable instance
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
	* @returns {TestaTest} This chainable instance
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
