/**
* Context object passed to each test as the function context and the only argument
*/
export default class TestaContext {
	test;

	constructor(base) {
		Object.assign(this, base);
	}

	log(...msg) {
		console.log('[TESTA]', ...msg);
		return this;
	}
}
