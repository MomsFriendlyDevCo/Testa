import {pGraph} from 'p-graph';
import {styleText} from 'node:util';

/**
* Top level class which handles test queuing
*/
export class TestaBase {
	bail = false; // FIXME: Not yet supported
	debug = false;
	tests = [];
	testNumber = 0;
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
	}


	/**
	* Execute a subset of tests, wrapped in a promise
	* This is the internal function used by `execAll()` - you almost always want that function instead of this
	*
	* @param {Array<Taska>} An array of tests to examine
	*
	* @param {Object} [options] Additional options to mutate behaviour
	* @param {Function} [options.filter] Filter function to apply to the input tests array before running
	* @param {Function} [options.onResolve] Function to run when a test succeeds. Called as `(test:Testa)`
	* @param {Function} [options.onReject] Function to run when a test succeeds. Called as `(test:Testa)`
	* @param {Function} [options.onSlow] Function to run when a test exceeds its slow timing. Called as `(test:Testa)`
	* @param {Function} [options.onTimeout] Function to run when a test exceeds its timeout timing and has been aborted. Called as `(test:Testa)`
	*
	* @returns {Promise} A promise which resolves when the operation has completed
	*/
	exec(tests, options) {
		let settings = {
			filter: null,
			onResolve: ()=> {},
			onReject: ()=> {},
			onSlow: ()=> {},
			onTimeout: ()=> {},
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
							{run: ()=> test.run({
								onSlow: settings.onSlow,
								onTimeout: settings.onTimeout,
							})
								.then(()=> settings.onResolve(test))
								.catch(()=> settings.onReject(test))
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


	execAll() {
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

		return Promise.resolve()
			.then(()=> { // Pre-flight checks
				if (tests.length == 0) throw new Error('No tests to run');
			})
			.then(()=> console.log(
				styleText(['bold', 'blue'], '[TESTA]'),
				'Going to run',
				tests.length,
				'tests',
			))
			.then(()=> this.debug && tests.forEach((test, testIndex) =>
				console.log(
					`TEST #${testIndex}`,
					test._id,
					'~',
					test._title,
					'@',
					test._location,
					test._depends ? 'Depends: ' + test._depends.join(' & ') : '',
				)
			))
			.then(()=> this.exec(tests, { // All before() blocks
				filter: test => test.priority == 'BEFORE',
			}))
			.then(()=> this.exec(tests, { // Main test body
				onResolve: ()=> stats.resolved++,
				onReject: ()=> stats.rejected++,
				onSlow: ()=> stats.slow++,
				onTimeout: ()=> stats.timeout++,
				filter: test => typeof test.priority != 'string',
			}))
			.then(()=> this.exec(tests, { // All after() blocks
				filter: test => test.priority == 'AFTER',
			}))
			.then(()=> console.log(...[
				styleText(['bold', 'blue'], '[TESTA]'),
				'Finished testing with',
				styleText(['bold', 'green'], ''+stats.resolved),
				'resolved and',
				styleText(stats.rejected > 0 ? ['bold', 'red'] : ['bold', 'white'], ''+stats.rejected),
				'rejected',
				...(stats.skipped > 0 ? [
					'with',
					styleText(['bold', 'yellow'], ''+stats.skipped),
					'skipped',
				] : []),
				...(stats.timeout > 0 ? [
					'with',
					styleText(['bold', 'red'], ''+stats.timeout),
					'timed out',
				] : []),
				...(stats.slow > 0 ? [
					'of which',
					styleText(['bold', 'yellow'], ''+stats.slow),
					'are slow',
				] : []),
				'from',
				styleText(['bold', 'yellow'], ''+tests.length),
				'total tests',
				...(tests.length != this.tests.length ? [
					'(' + styleText(['bold', 'yellow'], ''+this.tests.length),
					'non-filtered)',
				] : []),
			].filter(Boolean)))
	}
}

export default new TestaBase();
