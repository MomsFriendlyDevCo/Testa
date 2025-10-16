import {cleanError} from '../lib/utils.js';
import {styleText} from 'node:util';
import UIReport from './report.js';


/**
* Testa BDD UI
*
* @param {TestaBase} TestaBase Root TestaBase instance to use
* @returns {Promise} A promise which resolves when the operation has completed
*/
export default async function TestaUIBdd({TestaBase}) {
	let testSubset; // Subset of tests we are running
	let failed = []; // Eventual array of failed tests


	/**
	* Check if a test has already output its header and if not do so
	* This is used by intersticial events like `log()`, `warn()` & `stage()` to indicate a change to a test that has not yet completed
	*
	* @param {TestaTest} test The test being updated
	*/
	let checkTestHeader = (test) => {
		if (!test._outputHeader) {
			console.log(
				'  ',
				styleText(['bold', 'blue'], '➤'),
				test.toString(),
			);
			test._outputHeader = true;
		}
	};


	return Promise.resolve()
		.then(()=> TestaBase.execAll({
			onTests: tests => { // Run all queued tests
				testSubset = tests;
				console.log(...[
					styleText(['bgBlue', 'white', 'bold'], '[TESTA]'),
					'Going to run',
					tests.length,
					'tests',
					...(testSubset.length != TestaBase.tests.length ? [
						'(' + styleText(['bold', 'yellow'], ''+TestaBase.tests.length),
						'non-filtered)',
					] : []),
				].filter(Boolean));
			},
			onTestLog: (test, msg) => {
				checkTestHeader(test);
				console.log(
					'    ',
					styleText('blue', '🛈'),
					...msg,
				);
			},
			onTestWarn: (test, msg) => {
				checkTestHeader(test);
				console.log(
					'    ',
					styleText('yellow', '🛆'),
					...msg,
				);
			},
			onTestStage: (test, msg) => {
				checkTestHeader(test);
				console.log(
					'    ',
					styleText('cyan', '• ' + msg.join(' ')),
				);
			},
			onTestRejected: (test, msg) => {
				console.log(
					'  ',
					styleText(['bold', 'red'], '✖'),
					styleText('red', test.toString()),
					styleText(['bold', 'red'], '(failed)'),
				);
				console.log('  ', cleanError(msg, {indent: '    '}));
				failed.push(test);
			},
			onTestResolved: test => {
				console.log(
					'  ',
					styleText(['bold', 'green'], '✔'),
					test.toString(),
				);
			},
			onTestTimeout: test => {
				console.log(
					'  ',
					styleText(['bold', 'yellow'], '⏱'),
					styleText('yellow', test.toString()),
					styleText(['bold', 'yellow'], '(timeout)'),
				);
			},
			onTestSkipped: (test, msg) => {
				console.log(...[
					'  ',
					styleText(['bold', 'cyan'], '↷'),
					styleText(['cyan', 'strikethrough'], test.toString()),
					styleText(['bold', 'cyan'], '(skipped)'),
					...(msg ? [
						msg,
					] : []),
				].filter(Boolean));
			},
		}))
		.then(async (stats) => {
			await UIReport({TestaBase, failed});
			return stats;
		})
		.then(stats => console.log(...[ // Report stats
			styleText(['bgBlue', 'white', 'bold'], '[TESTA]'),
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
			styleText(['bold', 'yellow'], ''+testSubset.length),
			'total tests',
			...(testSubset.length != TestaBase.tests.length ? [
				'(' + styleText(['bold', 'yellow'], ''+TestaBase.tests.length),
				'non-filtered)',
			] : []),
		].filter(Boolean)))
}
