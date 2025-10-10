import {pGraph} from 'p-graph';

/**
* Top level class which handles test queuing
*/
export class TestaBase {

	/**
	* Whether we should stop processing after the first failed test
	*
	* @type {Boolean}
	*/
	bail = false; // FIXME: Not yet supported


	/**
	* Enable various debugging output
	*
	* @type {Boolean}
	*/
	debug = false;


	/**
	* Queue of tests
	*
	* @type {Array<TestaTest>}
	*/
	tests = [];


	/**
	* Current offset for test numbers
	* Indexed from 1
	*
	* @type {Number}
	*/
	testNumber = 1;


	/**
	* Current list of filters to apply when running `execAll()`
	*
	* @type {Array<Function>}
	*/
	filters = [];


	/**
	* Set of property defaults to apply to a test if the test has an undefined/null value for these keys
	*
	* @type {Object}
	*/
	testDefaults = {
		_slow: '75ms',
		_timeout: '2s',
	};


	/**
	* The number of tests to run in parallel
	*
	* @type {Number}
	*/
	concurrency = 5;


	/**
	* Add a Testa instance to the execution queue
	*
	* @param {Testa} testaInstance The instance to queue
	* @returns {TestaBase} This chainable instance
	*/
	queue(testaInstance) {
		this.tests.push(testaInstance);
		return this;
	}


	/**
	* Scan through all queued tests applying default settings
	*
	* @returns {TestaBase} This chainable instance
	*/
	applyDefaults() {
		this.tests.forEach(test => {
			Object.entries(this.testDefaults)
				.filter(([key]) => test[key] === undefined || test[key] === null)
				.forEach(([key, val]) => test[key] = val)
		});
		return this;
	}


	/**
	* Execute a subset of tests, wrapped in a promise
	* This is the internal function used by `execAll()` - you almost always want that function instead of this
	*
	* @param {Array<Taska>} tests An array of tests to examine
	*
	* @param {Object} [options] Additional options to mutate behaviour
	* @param {Function} [options.filter] Filter function to apply to the input tests array before running
	* @param {Function} [options.onStart] Function to run when a test starts. Called as `(test:Testa)`
	* @param {Function} [options.onLog] Function to run when a test logs some output. Called as `(test:Testa, msg:Array<Any>)`
	* @param {Function} [options.onSkip] Function to run when a test marks itself as skipped. Called as `(test:Testa, msg:Array<*>)`
	* @param {Function} [options.onResolve] Function to run when a test succeeds. Called as `(test:Testa)`
	* @param {Function} [options.onReject] Function to run when a test succeeds. Called as `(test:Testa)`
	* @param {Function} [options.onSlow] Function to run when a test exceeds its slow timing. Called as `(test:Testa)`
	* @param {Function} [options.onTimeout] Function to run when a test exceeds its timeout timing and has been aborted. Called as `(test:Testa)`
	*
	* @returns {Promise} A promise which resolves when the operation has completed
	*/
	exec(tests, options) {
		let settings = {
			/* eslint-disable no-unused-vars */
			filter: null,
			onStart: test => {},
			onLog: (test, msg) => {},
			onSkip: (test, msg) => {},
			onResolve: test => {},
			onReject: test => {},
			onSlow: test => {},
			onTimeout: test => {},
			...options,
		};

		return Promise.resolve()
			.then(()=> settings.filter
				? tests.filter(settings.filter)
				: tests
			)
			.then(runnables => pGraph(
				new Map( // Compute initial map of promises
					runnables.map(test =>
						[
							test._id || test._location,
							{run: ()=> Promise.resolve()
								.then(() => settings.onStart(test))
								.then(()=> test.run({
									onSkip: msg => settings.onSkip(test, msg),
									onLog: msg => settings.onLog(test, msg),
									onSlow: ()=> settings.onSlow(test),
									onTimeout: ()=> settings.onTimeout(test),
								}))
								.then(payload => test._status == 'resolved' && settings.onResolve(test, payload))
								.catch(payload => settings.onReject(test, payload))
							},
						]
					)
				),
				runnables // Compute dependency graph
					.filter(test => test._depends && test._depends.length > 0)
					.flatMap(test => test._depends.map(depend =>
						[depend, test._id]
					))
			).run())
	}


	/**
	* Execute all queued tests
	*
	* @param {Object} [options] Additional options to mutate behaviour
	* @param {Function} [options.onTests] Async function called as `(tests:Array<TestaTest>)` with the array of calculated tests to run in this session
	* @param {Function} [options.onRunBefore] Async function called as `()` before running the `before()` blocks
	* @param {Function} [options.onRunMain] Async function called as `()` before running the main test set
	* @param {Function} [options.onRunAfter] Async function called as `()` before running the `after()` blocks
	* @param {Function} [options.onRunComplete] Async function called as `()` after running all tests
	* @param {Function} [options.onTestStart] Async function called as `(test:Testa)` when starting to run a test
	* @param {Function} [options.onTestLog]  Async function called as `(test:Testa, msg:Array<Any>)` when a test logs some output
	* @param {Function} [options.onTestSkipped]  Async function called as `(test:Testa, msg:Array<Any>)` when a test marks itself as skipped
	* @param {Function} [options.onTestSlow] Async function called as `(test:Testa)` when a test is marked as running slow
	* @param {Function} [options.onTestTimeout] Async function called as `(test:Testa)` when a test has been aborted due to timeout
	* @param {Function} [options.onTestRejected] Async function called as `(test:Testa, payload:Any)` when a test has been rejected
	* @param {Function} [options.onTestResolved] Async function called as `(test:Testa, payload:Any)` when a test has been resolved
	*
	* @returns {Promise<Stats>} A promise which resolves when the operation has completed with the final stats
	*/
	execAll(options) {
		let settings = {
			onTests(tests) {},

			onRunBefore() {},
			onRunMain() {},
			onRunAfter() {},
			onRunComplete() {},

			onTestStart(test) {},
			onTestLog(test, msg) {},
			onTestSkipped(test, msg) {},
			onTestSlow(test) {},
			onTestTimeout(test) {},
			onTestRejected(test) {},
			onTestResolved(test) {},

			...options,
		};

		let stats = {
			skipped: 0,
			slow: 0,
			timeout: 0,
			resolved: 0,
			rejected: 0,
		};

		// Apply all defaults to tests
		this.applyDefaults();

		// Calculate what tests to run
		let tests = this.filters.length > 0
			? this.tests.filter(test => // Apply filters
				this.filters.every(filter => filter(test))
			)
			: this.tests;

		// Are some of the tests `only` marked? - If so restrict to those
		if (tests.some(t => t._only)) {
			if (this.debug) console.log('Restricting to only() marked tests');
			tests = tests.filter(t => t._only);
		}

		return Promise.resolve()
			.then(()=> { // Pre-flight checks
				if (tests.length == 0) throw new Error('No tests to run');
			})
			.then(()=> settings.onTests(tests))
			.then(()=> this.debug && tests.forEach((test, testIndex) =>
				console.log(
					`TEST #${testIndex}`,
					`ID:${test._id ? '"' + test._id + '"' : '(no ID)'}`,
					'~',
					`TITLE:${test._title ? '"' + test._title + '"' : '(no title)'}`,
					'@',
					`LOC:${test._location ? '"' + test._location + '"' : '(no loc)'}`,
					test._depends ? 'Depends: ' + test._depends.join(' & ') : '',
				)
			))
			.then(()=> settings.onRunBefore())
			.then(()=> this.exec(tests, { // All before() blocks
				filter: test => test.priority == 'BEFORE',
			}))
			.then(()=> settings.onRunMain())
			.then(()=> this.exec(tests, { // Main test body
				onStart: test => {
					settings.onTestStart(test);
				},
				onLog: (test, msg) => {
					settings.onTestLog(test, msg);
				},
				onSkip: (test, msg) => {
					settings.onTestSkipped(test, msg);
				},
				onSlow: test => {
					stats.slow++;
					settings.onTestSlow(test);
				},
				onTimeout: test => {
					stats.timeout++;
					settings.onTestTimeout(test);
				},
				onReject: (test, payload) => {
					stats.rejected++;
					settings.onTestRejected(test, payload);
				},
				onResolve: (test, payload) => {
					stats.resolved++;
					settings.onTestResolved(test, payload);
				},
				filter: test => typeof test.priority != 'string',
			}))
			.then(()=> settings.onRunAfter())
			.then(()=> this.exec(tests, { // All after() blocks
				filter: test => test.priority == 'AFTER',
			}))
			.then(()=> settings.onRunComplete())
			.then(()=> stats)
	}
}


/**
* Singleton root level TestaBase factory
*
* @type {TestaBase}
*/
export default new TestaBase();
