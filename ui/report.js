import {styleText} from 'node:util';

/**
* Testa UI output that is also designed to simply report on already run tests
*
* @param {Object} context The UI context
* @param {TestaBase} TestaBase The root TestaBase instance
* @param {Array<Testa>} [failed] Optional, pre-existing array of failed tests. If provided `execAll()` is skipped
*
* @param {Object} [options] Additional options to mutate behaviour
* @param {Boolean} [options.paddingTop] Add a line space at the top of the report
* @param {Boolean} [options.paddingBetween] Add a line space between items
* @param {Boolean} [options.paddingBottom] Add a line space at the bottom of the report
*/
export default async function TestaUIFancy({TestaBase, failed, options}) {
	let settings = {
		paddingTop: true,
		paddingBetween: true,
		paddingBottom: true,
		...options,
	};

	return Promise.resolve()
		.then(()=> {
			if (failed) {
				return failed;
			} else { // No pre-existing list - collect
				let failedTests = [];
				return TestaBase.execAll({
					onTestRejected: test => failedTests.push(test),
					onTestTimeout: test => failedTests.push(test),
				})
					.then(()=> failedTests)
			}
		})
		.then(tests => {
			if (settings.paddingTop) console.log();
			tests.forEach(test => {
				console.log(
					styleText(['bold', 'red'], test.toString('id||location'))
						+ '. '
						+ styleText('red', test.toString('title')),
					test._status == 'rejected' ? styleText('red', '(failed)')
						: test._status == 'timeout' ? styleText('yellow', '(timeout)')
						: ''
				);
				console.log(test._error);
				if (settings.paddingBetween) console.log();
			});
			if (settings.paddingBottom) console.log();
		});
}
