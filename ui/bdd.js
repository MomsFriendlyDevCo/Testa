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
	* Output helper
	*
	* @param {'header'|'footer'|'result'} type The formatting type to apply
	* @param {*...} [msg] Items to output, falsy items are removed
	* @returns {Void}
	*/
	let log = (type, msg) => console.log(...[
		...(
			type == 'header' || type == 'footer' ? [styleText(['bgBlue', 'white', 'bold'], '[TESTA]')]
			: ['  ']
		),
		...msg,
	].filter(Boolean));

	return Promise.resolve()
		.then(()=> TestaBase.execAll({
			onTests: tests => { // Run all queued tests
				testSubset = tests;
				log('header', [
					'Going to run',
					tests.length,
					'tests',
					...(testSubset.length != TestaBase.tests.length ? [
						'(' + styleText(['bold', 'yellow'], ''+TestaBase.tests.length),
						'non-filtered)',
					] : []),
				]);
			},
			onTestRejected: test => {
				log('result', [
					styleText(['bold', 'red'], '✖'),
					styleText('red', test.toString()),
					styleText(['bold', 'red'], '(timeout)'),
				]);
				failed.push(test);
			},
			onTestResolved: test => {
				log('result', [
					styleText(['bold', 'green'], '✔'),
					test.toString(),
				]);
			},
			onTestTimeout: test => {
				log('result', [
					styleText(['bold', 'yellow'], '⏱'),
					styleText('yellow', test.toString()),
					styleText(['bold', 'yellow'], '(timeout)'),
				]);
			},
			onTestSkipped: (test, msg) => {
				log('result', [
					styleText(['bold', 'cyan'], '↷'),
					styleText('cyan', test.toString()),
					styleText(['bold', 'cyan'], '(skipped)'),
					...(msg ? [
						msg,
					] : []),
				]);
			},
		}))
		.then(()=> UIReport({TestaBase, failed}))
		.then(stats => log('footer', [ // Report stats
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
		]))
}
