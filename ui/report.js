import {styleText} from 'node:util';
import {cleanError} from '../lib/utils.js';

/**
* Testa UI output that is also designed to simply report on already run tests
*
* @param {Object} context The UI context
* @param {TestaBase} context.TestaBase The root TestaBase instance
* @param {Array<TestaTest>} [context.failed] Optional, pre-existing array of failed tests. If provided `execAll()` is skipped
*
* @param {Object} [context.options] Additional options to mutate behaviour. Some settings can accept a Boolean or `err` (only perform if there are failed tests) or `no-err` (the inverse)
* @param {Boolean|'err'|'no-err'} [context.options.border='err'] Add a horizontal line above the report area
* @param {Boolean} [context.options.paddingBorder=true] Add a line space before the border line
* @param {Boolean|'err'|'no-err'} [context.options.paddingTop='err'] Add a line space at the top of the report (this occurs after the border)
* @param {Boolean} [context.options.paddingBetween=true] Add a line space between items
* @param {Boolean|'err'|'no-err'} [context.options.paddingBottom='err'] Add a line space at the bottom of the report
*
* @returns {Promise} A promise which resolves when the operation has completed
*/
export default async function TestaUIFancy({TestaBase, failed, options}) {
	let settings = {
		border: 'err',
		paddingBorder: true,
		paddingTop: 'err',
		paddingBetween: true,
		paddingBottom: true,
		...options,
	};

	let failedTests; // Eventual array of tests that failed

	/**
	* Helper function to perform a callback if the settings is literal boolean `true` or if the settings is `err` + the are any failed tests
	* This is used by various formatting settings like `border` + `paddingBorder` to determine if those UI elements should be added
	*
	* @param {Boolean|'err'} setting Setting to examine
	* @param {Function} action The callback action to run if the conditions are satisfied
	*/
	let selectiveAction = (setting, action) => {
		if (
			setting === true
			|| (setting == 'err' && failedTests.length > 0)
			|| (setting == 'no-err' && failedTests.length == 0)
		) {
			action();
		}
	};


	return Promise.resolve()
		.then(()=> {
			if (failed) {
				failedTests = failed;
			} else { // No pre-existing list - collect
				return TestaBase.execAll({
					onTestRejected: test => failedTests.push(test),
					onTestTimeout: test => failedTests.push(test),
				})
			}
		})
		.then(()=> {
			selectiveAction(settings.border, ()=> { // Add UI border?
				if (settings.paddingBorder) console.log();

				console.log(styleText('grey', '┄').repeat(process.stdout.columns));
			});

			selectiveAction(settings.paddingTop, ()=> console.log()); // Add top padding?

			failedTests.forEach(test => {
				console.log(
					styleText(['bold', 'red'], test.toString('id'))
						+ '. '
						+ styleText('red', test.toString('title')),
					test._status == 'rejected' ? styleText(['bold', 'red'], '(failed)')
						: test._status == 'timeout' ? styleText(['bold', 'yellow'], '(timeout)')
						: ''
				);

				if (test._location)
					console.log(
						styleText('grey', '@ ' + test.toString('location'))
					);

				console.log(cleanError(test._error));

				if (settings.paddingBetween) console.log();
			});

			selectiveAction(settings.paddingBottom, ()=> console.log()); // Add bottom padding?
		});
}
