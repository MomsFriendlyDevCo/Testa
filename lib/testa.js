import TestaBase from './base.js';
import TestaContext from './context.js';

/**
* Main Test wrapper
*/
export class Testa {
	_id;
	_handler;
	_title;
	_skip = false;
	_depends;

	id(id, ...args) {
		this._id = id;
		return this.chain(args);
	}

	handler(cb, ...args) {
		this._handler = cb;
		return this.chain(args);
	}

	title(title, ...args) {
		this._title = title;
		return this.chain(args);
	}

	run() {
		if (this._skip) {
			// FIXME: Handle skip reporting
			return null;
		} else {
			let context = new TestaContext({
				test: this,
			});
			return this._handler.call(context, context);
		}
	}

	chain(args) {
		console.log('CHAIN', args);
		if (!args[0]) { // No payload
			// Pass
		} else if (typeof args[0] == 'function') {
			this.handler(args[0]);
		} else {
			throw new Error('Dont know how to chain non-function payload!');
		}
		return this;
	}

	skip(...args) {
		this._skip = true;
		return this.chain(args);
	}

	depends(...args) {
		let slicePoint = args.findIndex(a => typeof a != 'string');
		if (slicePoint < 0) throw new Error('testa.depends() had no IDs listed as dependencies');

		console.log('DEPENDS SPLIT', {
			slicePoint,
			dependsIds: args.slice(0, slicePoint -1),
			args: args.slice(slicePoint),
		});

		this._depends = [...this.depends, args.slice(0, slicePoint -1)];
		return this.chain(args.slice(slicePoint));
	}
}

export function test(title, handler) {
	// Argument munging {{{
	if (typeof title == 'string' && typeof handler == 'function') {
		// Pass
	} else if (typeof title == 'function' && !handler) {
		[title, handler] = ['unnamed', title];
	} else {
		throw new Error(`Unknown call signature for test(title:String, handler:Function) - got (${typeof title}, ${typeof handler})`);
	}
	// }}}

	let testa = new Testa()
		.title(title)
		.handler(handler);

	TestaBase.queue(testa);
	return testa;
}

// Allow test.THING() to map to test() while setting that as a flag
// e.g. 'test.skip(title, handler)' -> `new Testa.title(title).handler(handler).skip()`
[
	'id',
	'depends',
	'skip',
]
	.forEach(f => {
		test[f] = (title, handler) => test(title, handler)[f]();
	});

test.exec = TestaBase.execAll;

export {expect} from 'chai';
