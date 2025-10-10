import {styleText} from 'node:util';

export default async function TestaUIBdd({TestaBase}) {
	let testSubset; // Subset of tests we are running

	/**
	* Output helper
	* @param {*} [...msg] Items to output, falsy items are removed
	*/
	let log = msg => console.log(
		styleText(['bold', 'blue'], '[TESTA]'),
		...msg.filter(Boolean)
	);

	return Promise.resolve()
		.then(()=> TestaBase.execAll({
			onTests: tests => { // Run all queued tests
				testSubset = tests;
				log([
					'Going to run',
					tests.length,
					'tests',
					...(testSubset.length != TestaBase.tests.length ? [
						'(' + styleText(['bold', 'yellow'], ''+TestaBase.tests.length),
						'non-filtered)',
					] : []),
				]);
			},
			onTestRejected: (test, err) => {
				log([
					styleText(['bold', 'red'], '✖'),
					styleText('red', test.toString()),
					...(msg ? [
						msg,
					] : []),
				]);
			},
			onTestRejected: test => {
				log([
					styleText(['bold', 'red'], '✖'),
					styleText('red', test.toString()),
					styleText(['bold', 'red'], '(timeout)'),
				]);
			},
			onTestResolved: test => {
				log([
					styleText(['bold', 'green'], '✔'),
					test.toString(),
				]);
			},
			onTestSkipped: (test, msg) => {
				log([
					styleText(['bold', 'cyan'], '⤼'),
					styleText('cyan', test.toString()),
					styleText(['bold', 'cyan'], '(skipped)'),
					...(msg ? [
						msg,
					] : []),
				]);
			},
		}))
		.then(stats => log([ // Report stats
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
