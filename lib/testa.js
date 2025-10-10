import TestaBase from './base.js';
import TestaTest from './test.js';

/**
* Main library entrypoint
*/


/**
* Main Testa worker
* This is a factory function which generates TestaTest instances
*
* @param {String} [title] The title of the test, this can also be specified later
* @param {Function} [handler] The worker function for the test, this can also be specified later
* @returns {TestaTest} A created TestaTest instance
*/
export default function testa(title, handler) {
	// Argument munging {{{
	if (
		(!title && !handler) //~ test()
		|| (typeof title == 'string' && !handler) //~ test(title:String)
		|| (typeof title == 'string' && typeof handler == 'function') //~ test(title:String, handler:Function)
	) {
		// Pass
	} else if (typeof title == 'function' && !handler) { //~ test(handler:Function)
		[title, handler] = ['unnamed', title];
	} else { //~ test(*)
		throw new Error(`Unknown call signature for test(title:String, handler:Function) - got (${typeof title}, ${typeof handler})`);
	}
	// }}}

	let testa = new TestaTest();
	if (title) testa.title(title);
	if (handler) testa.handler(handler);

	TestaBase.queue(testa);
	return testa;
}

export let test = testa;

// Setup: Aliasing - test.THING() mappings {{{
// Allow test.THING() to map to test() while setting that as a flag
// e.g. 'test.skip(title, handler)' -> `new TestaTest.title(title).handler(handler).skip()`
[
	'id',
	'location',
	'handler',
	'do',
	'title',
	'skip',
	'only',
	'priority',
	'depends',
	'slow',
	'timeout',
]
	.forEach(f =>
		test[f] = (...args) => testa()[f](...args)
	);
// }}}

// Setup: before(), after() {{{
test.before = (...args) => testa().priority('BEFORE', ...args);
export let before = test.before;

test.after = (...args) => testa().priority('AFTER', ...args);
export let after = test.after;
// }}}

export {expect} from 'chai';
