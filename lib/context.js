import {styleText} from 'node:util';
import timestring from 'timestring';

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


	/**
	* Wrapper around timestring() + setTimeout() to wait for an arbitrary amount of time
	*
	* @param {Number|String} delay The amount of time to wait either as a number of milliseconds or a valid timestring
	* @returns {Promise} A promise which resolves when the delay has elapsed
	*/
	wait(delay) {
		return new Promise(resolve =>
			setTimeout(
				resolve,
				typeof delay == 'string' ? timestring(delay, 'ms') : delay
			)
		);
	}
}
