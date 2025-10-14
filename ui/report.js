import {styleText} from 'node:util';

/**
* Testa UI output that is also designed to simply report on already run tests
*
* @param {Object} context The UI context
* @param {TestaBase} context.TestaBase The root TestaBase instance
* @param {Array<TestaTest>} [context.failed] Optional, pre-existing array of failed tests. If provided `execAll()` is skipped
*
* @param {Object} [context.options] Additional options to mutate behaviour
* @param {Boolean} [context.options.border=true] Add a horizontal line above the report area
* @param {Boolean} [context.options.paddingBorder=true] Add a line space before the border line
* @param {Boolean} [context.options.paddingTop=true] Add a line space at the top of the report (this occurs after the border)
* @param {Boolean} [context.options.paddingBetween=true] Add a line space between items
* @param {Boolean} [context.options.paddingBottom=true] Add a line space at the bottom of the report
*
* @returns {Promise} A promise which resolves when the operation has completed
*/
export default async function TestaUIFancy({TestaBase, failed, options}) {
	let settings = {
		border: true,
		paddingBorder: true,
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
			if (settings.paddingBorder) console.log();
			if (settings.border) console.log(styleText('grey', '┄').repeat(process.stdout.columns));

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
