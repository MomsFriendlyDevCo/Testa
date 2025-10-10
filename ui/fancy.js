import Listr from 'listr';
import UIReport from './report.js';

export default async function TestaUIFancy({TestaBase}) {
	let listr; // Eventual Listr instance, created when onTests() resolves
	let failed = []; // Eventual array of failed tests

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
							task.listrTask = task;
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
			onTestRejected: (test, err) => {
				test.resolvers.resolve(err);
				failed.push(test);
			},
			onTestResolved: test => {
				test.resolvers.resolve();
			},
			onTestSkipped: (test, msg) => {
				task.listrTask.skip(msg);
			},
		}))
		.then(()=> UIReport({TestaBase, failed}))
}
