/**
* Top level class which handles test queuing
*/
export class TestaBase {
	tests = [];

	queue(testaInstance) {
		this.tests.push(testaInstance);
		return this;
	}


	execAll() {
		return Promise.resolve()
			.then(()=> console.log('DEBUG: ALL TESTS START'))
			.then(()=> Promise.all(
				this.tests.map(test => {
					console.log('DEBUG: RUN TEST', test._title);
					return test.run();
				})
			))
			.then(()=> console.log('DEBUG: ALL TESTS END'))
	}
}

export default new TestaBase();
