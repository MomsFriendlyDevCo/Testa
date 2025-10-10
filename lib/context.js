import {styleText} from 'node:util';

/**
* Context object passed to each test as the function context and the only argument
*/
export default class TestaContext {
	test;

	constructor(base) {
		Object.assign(this, base);
	}


	/**
	* Output some logging information relative to a test
	*
	* @param {*} [...msg] Log component to output
	* @returns {TestaContext} This chainable instance
	*/
	log(...msg) {
		console.log(
			styleText(['bold', 'blue'], `[TESTA ${this.test.toString()}]`),
			...msg
		);
		return this;
	}


	/**
	* Mark this test as skipped with an optional reason
	*
	* @param {*} [...msg] Optional reason for skipping
	* @returns {TestaContext} This chainable instance
	*/
	skip(...msg) {
		this.test.skip(msg.join(' '));
		return this;
	}
}
