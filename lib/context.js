import JSON5 from 'json5';
import temp from 'temp';
import {sortKeys} from './utils.js';
import TestaBase from './base.js';
import timestring from 'timestring';
import {writeFile} from 'node:fs/promises';

/* eslint-disable no-unused-vars */


/**
* Context object passed to each test as the function context and the only argument
*/
export default class TestaContext {

	/* eslint-disable jsdoc/require-returns-check */

	/**
	* Associated TestaTest for this context
	*
	* @type {TestaTest}
	*/
	test;

	constructor(base) {
		Object.assign(this, base);
	}


	/**
	* Output some logging information relative to a test
	*
	* @param {*...} [msg] Log component to output
	* @returns {TestaContext} This chainable instance
	*/
	log(...msg) {
		throw new Error('Upstream UI expected to replace TestaContext.log()');
	}


	/**
	* Output some log warning information relative to a test
	*
	* @param {*...} [msg] Log component to output
	* @returns {TestaContext} This chainable instance
	*/
	warn(...msg) {
		throw new Error('Upstream UI expected to replace TestaContext.warn()');
	}


	/**
	* Output some detailed debugging information as a complex object
	* This is designed to dump complex data to a temporary file for examinination later
	* This function does not have to be awaited - it will continue writing data in the background when called in sync
	*
	* @param {*...} msg Message parts to output
	* @param {Object} [options] Additional options to mutate behaviour
	* @param {Boolean} [options.normalize=false] Sort keys before saving for a side-by-side JSON diff
	*
	* @returns {TestaContext} This chainable instance
	*/
	dump(...msg) {
		let settings = {
			normalize: false,
		};

		let dumpFilePath = temp.path(TestaBase.dumpSettings.temp);

		// Spew to TestaTest._dumps ASAP so we can report on this even if the file is still writing
		let dumpEntry = {
			path: dumpFilePath,
			// size field appended when the (possibly) async formatter has completed
		};
		this.test._dumps.push(dumpEntry);

		this.log('Dump artefact saved as', dumpFilePath);

		// Compute what we are dumping (extracting last arg if it looks like settings)
		let dumpFileOutput;
		if (msg.length < 1) {
			throw new Error('Test.dump() should contain a payload - nothing to dump!');
		} else if (msg.length == 1) { // Only one arg anyway - assume we're using that
			dumpFileOutput = msg[0];
		} else if (typeof msg.at(-1) == 'object' && 'normalize' in msg.at(-1)) { // Last argument looks like its a settings object
			dumpFileOutput = msg.length == 2 ? msg[0] : msg.slice(0, -1); // Use only object given if the settings object is last anyway, otherwise splat everything
			settings = {...settings, ...msg.at(-1)};
		} else { // Everything else - assume all args need dumping
			dumpFileOutput = msg;
		}

		// Sort keys if we're working normalizely
		if (settings.normalize) {
			dumpFileOutput = sortKeys(dumpFileOutput);
		}

		let content; // Eventual String/ Buffer content to output
		switch (TestaBase.dumpSettings.format) {
			case 'json':
				content = JSON.stringify(dumpFileOutput, null, TestaBase.dumpSettings.json.space);
				break;
			case 'json5':
				content = JSON5.stringify(dumpFileOutput, TestaBase.dumpSettings.json5);
				break;
			default:
				throw new Error(`Unknown TestaBase.dumpSettings.format "${TestaBase.dumpSettings.format}"`);
		}
		dumpEntry.size = content?.length || 0;

		// Write file in the background
		dumpEntry.promise = writeFile(dumpFilePath, content || '');

		return this;
	}


	/**
	* Signal that we are at a specific sub-stage within a test function
	* In most cases this acts as a bookmark
	*
	* @param {*...} [msg] Stage component to output
	* @returns {TestaContext} This chainable instance
	*/
	stage(...msg) {
		throw new Error('Upstream UI expected to replace TestaContext.stage()');
	}


	/**
	* Mark this test as skipped with an optional reason
	*
	* @param {*...} [msg] Optional reason for skipping
	* @returns {TestaContext} This chainable instance
	*/
	skip(...msg) {
		throw new Error('Upstream UI expected to replace TestaContext.skip()');
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
