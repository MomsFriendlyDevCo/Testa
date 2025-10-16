import {styleText} from 'node:util';

/**
* Testa UI output that is also designed to simply summarise already run tests
*
* @param {Object} context The UI context
* @param {TestaBase} context.TestaBase The root TestaBase instance
*/
export default async function TestaUIStats({TestaBase, options}) {
	let settings = {
		paddingTop: true,
		paddingExtrasTop: true,
		paddingExtrasBottom: true,
		paddingBottom: true,
		...options,
	};

	return Promise.resolve()
		.then(()=> {
			if (!TestaBase.stats) { // Not run tests yet - do that now
				return TestaBase.execAll();
			}
		})
		.then(()=> console.log(
			styleText(['bgBlue', 'white', 'bold'], '[TESTA]'),
			'Finished testing with',
			styleText(['bold', 'green'], ''+TestaBase.stats.resolved),
			'resolved and',
			styleText(TestaBase.stats.rejected > 0 ? ['bold', 'red'] : ['bold', 'white'], ''+TestaBase.stats.rejected),
			'rejected',
		))
		.then(()=> settings.paddingTop && console.log())
		.then(()=> settings.paddingExtrasTop && (TestaBase.stats.skipped || TestaBase.stats.timeout || TestaBase.stats.slow || TestaBase.stats.run != TestaBase.stats.total) && console.log())
		.then(()=> TestaBase.stats.skipped > 0 && console.log(
			'  •',
			styleText(['bold', 'cyan'], ''+TestaBase.stats.skipped),
			'skipped',
		))
		.then(()=> TestaBase.stats.timeout > 0 && console.log(
			'  •',
			styleText(['bold', 'yellow'], ''+TestaBase.stats.timeout),
			'timed out',
		))
		.then(()=> TestaBase.stats.slow > 0 && console.log(
			'  •',
			styleText(['bold', 'cyan'], ''+TestaBase.stats.slow),
			'are slow',
		))
		.then(()=> TestaBase.stats.run != TestaBase.stats.total && console.log(
			'  • filtered to',
			styleText('white', ''+TestaBase.stats.run),
			'/',
			styleText(['bold', 'white'], ''+TestaBase.stats.total),
			'total tests',
		))
		.then(()=> settings.paddingExtrasBottom && (TestaBase.stats.skipped || TestaBase.stats.timeout || TestaBase.stats.slow || TestaBase.stats.run != TestaBase.stats.total) && console.log())
		.then(()=> settings.paddingBottom && console.log())
		.then(()=> TestaBase.stats.rejected && console.log(
			styleText(['bgBlue', 'white', 'bold'], '[TESTA]'),
			styleText(['bold', 'red'], ''+TestaBase.stats.rejected),
			'tests failed',
		))
}
