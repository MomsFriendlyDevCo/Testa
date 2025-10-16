import {styleText} from 'node:util';

/**
* Testa UI output that is also designed to simply summarise already run tests
*
* @param {Object} context The UI context
* @param {TestaBase} context.TestaBase The root TestaBase instance
*/
export default async function TestaUIStats({TestaBase, options}) {
	let settings = {
		paddingTop: 'err',
		...options,
	};

	return Promise.resolve()
		.then(()=> {
			if (!TestaBase.stats) { // Not run tests yet - do that now
				return TestaBase.execAll();
			}
		})
		.then(()=> console.log(...[ // Report TestaBase.stats
			styleText(['bgBlue', 'white', 'bold'], '[TESTA]'),
			'Finished testing with',
			styleText(['bold', 'green'], ''+TestaBase.stats.resolved),
			'resolved and',
			styleText(TestaBase.stats.rejected > 0 ? ['bold', 'red'] : ['bold', 'white'], ''+TestaBase.stats.rejected),
			'rejected',
			...(TestaBase.stats.skipped > 0 ? [
				'with',
				styleText(['bold', 'yellow'], ''+TestaBase.stats.skipped),
				'skipped',
			] : []),
			...(TestaBase.stats.timeout > 0 ? [
				'with',
				styleText(['bold', 'red'], ''+TestaBase.stats.timeout),
				'timed out',
			] : []),
			...(TestaBase.stats.slow > 0 ? [
				'of which',
				styleText(['bold', 'yellow'], ''+TestaBase.stats.slow),
				'are slow',
			] : []),
			'from',
			styleText(['bold', 'yellow'], ''+TestaBase.stats.run),
			'total tests',
			...(TestaBase.stats.run != TestaBase.stats.total ? [
				'(' + styleText(['bold', 'yellow'], ''+TestaBase.stats.total),
				'non-filtered)',
			] : []),
		].filter(Boolean)))
}
