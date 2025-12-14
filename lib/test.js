import {cleanError} from './utils.js';
import {styleText} from 'node:util';
import TestaBase from './base.js';
import TestaContext from './context.js';
import timestring from 'timestring';

/**
* Main Test class instance
*/
export default class TestaTest {

	// Basic state - id(String), location(location:Object), handler(Function), do(Function), title(String), describe(String) {{{
	/**
	* Dev specified ID for the Test
	* This is useful mainly for dependency checking and referring to tests
	*
	* @type {String}
	*/
	_id = '#' + TestaBase.testNumber++;


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


	/**
	* The fullly formatted location string, if any
	*
	* @type {Object?}
	* @property {String} file File path relative to `TestaBase.basePath`
	* @property {Number} line The line offset within the file
	* @property {Number} column The column offset within the file
	*/
	_location;


	/**
	/**
	* Specify the current test location
	* This should usually be fed the output of TestaUtils.getLocation()
	*
	* @param {Object} location Object containing the tests providence
	* @param {*...} [args] Additional args passed to `argsHandler()`
	* @returns {TestaTest} This chainable instance
	*/
	location(location, ...args) {
		this._location = location;
		return this.argsHandler(args);
	}


	/**
	* The raw, dev-specified test running function
	*
	* @type {Function}
	*/
	_handler;


	/**
	* Set the Test worker function
	*
	* @param {Function} cb The test worker function
	* @param {*...} [args] Additional args passed to `argsHandler()`
	* @returns {TestaTest} This chainable instance
	*/
	handler(cb, ...args) {
		this._handler = cb;
		return this.argsDeny(args);
	}


	/**
	* Set the Test worker function
	*
	* @alias handler()
	* @param {Function} cb The test worker function
	* @param {*...} [args] Additional args passed to `argsHandler()`
	* @returns {TestaTest} This chainable instance
	*/
	do(cb, ...args) {
		this._handler = cb;
		return this.argsHandler(args);
	}


	/**
	* A short, pithy title for a test
	*
	* @type {String}
	*/
	_title;


	/**
	* Set the short, pithy title for a test
	*
	* @param {String} title The new title to allocate
	* @param {*...} [args] Additional args passed to `argsHandler()`
	* @returns {TestaTest} This chainable instance
	*/
	title(title, ...args) {
		this._title = title;
		return this.argsHandler(args);
	}


	/**
	* Longer form, human-readable description for a test
	*
	* @type {String}
	*/
	_description;


	/**
	* Set the longer form, human-readable description for a test
	*
	* @param {String} description The new description to allocate
	* @param {*...} [args] Additional args passed to `argsHandler()`
	* @returns {TestaTest} This chainable instance
	*/
	describe(description, ...args) {
		this._description = description;
		return this.argsHandler(args);
	}
	// }}}

	// Flow - skip(), only(), priority(String|Number), depends(...String), before(...String), after(...String), series() {{{

	/**
	* Whether this test is marked as pre-skipped
	*
	* @type {Boolean}
	*/
	_skip = false;


	/**
	* Optional payload for a reason a test was skipped
	*
	* @type {String}
	*/
	_skipReason;


	/**
	* Mark this test as pre-skipped
	* Can also use `context.skip()` within a test to do this dynamically
	*
	* @param {String} [reason] Optional reason a test was skipped
	* @param {*...} [args] Additional args passed to `argsHandler()`
	* @returns {TestaTest} This chainable instance
	*/
	skip(reason, ...args) {
		this._skip = true;
		this._skipReason = reason;
		return this.argsHandler(args);
	}


	/**
	* Whether this test is marked for 'only' consideration
	* If any tests have this marker only those tests are considered as candidates
	* @type {Boolean}
	*/
	_only = false;


	/**
	* Mark this test for 'only' consideration
	* If any tests have this marker only those tests are considered as candidates
	*
	* @param {*...} [args] Additional args passed to `argsTitleHandler()`
	* @returns {TestaTest} This chainable instance
	*/
	only(...args) {
		this._only = true;
		return this.argsTitleHandler(args);
	}


	/**
	* This tests priority execution order
	* Higher priorities are executed first
	* Two meta priorities: 'BEFORE' and 'AFTER' are also supported
	*
	* @type {Number|'BEFORE'|'AFTER'}
	*/
	_priority;


	/**
	* Set the priority of a test
	* This tests priority execution order
	* Two meta priorities: 'BEFORE' and 'AFTER' are also supported
	*
	* @param {Number|'BEFORE'|'AFTER'} level The level to set, Higher priorities are executed first
	* @param {*...} [args] Additional args passed to `argsTitleHandler()`
	* @returns {TestaTest} This chainable instance
	*/
	priority(level, ...args) {
		this._priority = level;
		return this.argsTitleHandler(args);
	}


	/**
	* List of other test IDs required before this test can execute
	*
	* @type {Array<String>} An array of IDs to await before execution
	*/
	_depends;


	/**
	* Set a list of test IDs to await before trying to run
	*
	* @param {String...} ids A list of other test IDs required before this test can execute
	* @returns {TestaTest} This chainable instance
	*/
	depends(...ids) {
		if (ids.length == 0) return this;
		if (!ids.every(a => typeof a == 'string')) throw new Error('All arguments to Testa.depends() / Testa.before() must be string IDs');
		this._depends = [...(this._depends || []), ...ids];
		return this;
	}


	/**
	* Alias for `depends()`
	* @alias depends()
	*/
	before(...ids) {
		return this.depends(...ids);
	}


	/**
	* List of other test IDs required after this test has executed
	*
	* @type {Array<String>} An array of IDs to await before execution
	*/
	_postDepends;


	/**
	* Set a list of test IDs to await AFTER this test has run
	* This effectively operates as a backwards dependency
	*
	* @param {String...} ids A list of other test IDs required after this test has executed
	* @returns {TestaTest} This chainable instance
	*/
	postDepends(...ids) {
		if (ids.length == 0) return this;
		if (!ids.every(a => typeof a == 'string')) throw new Error('All arguments to Testa.postDepends() / Testa.after() must be string IDs');
		this._postDepends = [...(this._postDepends || []), ...ids];
		return this;
	}


	/**
	* Alias for `postDepends()`
	* @alias postDepends()
	*/
	after(...ids) {
		return this.postDepends(...ids);
	}


	/**
	* Treat this test as requiring an isolated in-series (rather than in parallel) runner
	*
	* @type {Boolean}
	*/
	_series = false;


	/**
	* Mark this test as requiring an isolated in-series runner
	* This differs from regular tests in that its force to run in a series rather than in massive-parallel - the default Testa behaviour
	*
	* @param {Boolean} [isSeries=true] True to mark this test as a series/serial test
	* @returns {TestaTest} This chainable instance
	*/
	series(isSeries = true) {
		this._series = isSeries;
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
	* @param {Function} [options.onStage] Function called as `(msg:Array<Any>)` when a test reaches a new stage
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
			onStage: msg => {},
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
			stage: (...msg) => settings.onStage(msg),
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
			case 'location':
				return (this._location
					? `${this._location.file} +${this._location.line}` // NOTE: We purposely omit line here as its pretty useless
					: '(no location)'
				)
			case 'title':
				return this._title || '(No title)';
			default:
				return (
					(typeof this._priority == 'string' ? `${this._priority}:` : '')
					+ (this._title || this._id || this._location)
				);
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

	// Misc state {{{

	/**
	* Tracker for any relevent dumps from a test
	*
	* @type {Array<Object>} An array of dump objects
	* @property {String} path The dump file path
	*/
	_dumps = [];
	// }}}

}
