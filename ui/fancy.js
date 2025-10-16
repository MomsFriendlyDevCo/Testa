import Listr from 'listr';
import UIReport from './report.js';


/**
* Testa Fancy UI
*
* @param {TestaBase} TestaBase Root TestaBase instance to use
* @returns {Promise} A promise which resolves when the operation has completed
*/
export default async function TestaUIFancy({TestaBase}) {
	let listr; // Eventual Listr instance, created when onTests() resolves
	let failed = []; // Eventual array of failed tests

	// Map for TestaTest -> ListrTasks, allocated when setting up the main Listr instance
	let test2task = new Map();

	return Promise.resolve()
		.then(()=> TestaBase.execAll({
			onTests: tests => { // Run all queued tests
				// Pin resolvers to each test
				tests.forEach(test =>
					test.resolvers = Promise.withResolvers()
				);

				// Create Listr instance
				listr = new Listr(
					tests.map(test => ({
						title: test.toString(),
						task: (ctx, task) => {
							test2task.set(test, task);
							return test.resolvers.promise;
						},
					})),
					{
						concurrent: true, // Handled upstream anyway
						exitOnError: false, // Don't die if something fails
					},
				);

				listr.run();
			},
			onTestLog: (test, msg) => {
				test2task.get(test).output = msg.join(' ');
			},
			onTestWarn: (test, msg) => {
				test2task.get(test).output = msg.join(' ');
			},
			onTestStage: (test, msg) => {
				test2task.get(test).output = msg.join(' ');
			},
			onTestRejected: (test, err) => {
				test.resolvers.resolve(err);
				failed.push(test);
			},
			onTestResolved: test => {
				test.resolvers.resolve();
			},
			onTestTimeout: test => {
				test.resolvers.reject('Timeout');
				failed.push(test);
			},
			onTestSkipped: (test, msg) => {
				test2task.get(test).skip(msg);
			},
		}))
		.then(()=> UIReport({TestaBase, failed}))
		.then(()=> UIStats({TestaBase}))
}
