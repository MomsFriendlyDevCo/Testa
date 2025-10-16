import cleanStack from 'clean-stack';
import {relative as pathRelative} from 'node:path';
import TestaBase from './base.js';

/**
* Simple function to escape a string so that its compatible with a RegExp
* @param {string} str The input string
* @returns {string} An escaped RegExp compatible string
* @url https://github.com/MomsFriendlyDevCo/Nodash
*/
export function regexpEscape(str) {
	return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}


/**
* Output an error as cleanly as possible
*
* @param {Error|Array} err Raw error object to report on or an array of promise rejection parts
*
* @param {Object} [options] Additional options to mutate behaviour
* @param {String} [options.cwd] The base directory to use for relative paths
* @param {Boolean} [options.pretty=true] Output with coloring
* @param {String} [options.indent] Optional indent-per-line to apply
*
* @returns {String} String content usable with console.log or other TTY outputs
*/
export function cleanError(err, options) {
	let settings = {
		cwd: TestaBase.basePath,
		indent: false,
		pretty: true,
		...options,
	};

	let errObject =
		err instanceof Error ? err // Already an Error object
		: Array.isArray(err) ? new Error(err.join(' ')) // Create from Array parts
		: err.response?.status && err.request?.url && typeof err.response.status == 'number' ? new Error(`HTTP Code ${err.response.status} from ${err.request.url}`) // Fetch / Axios response-a-like
		: (()=> {
			console.warn('TestaUtils.cleanError() given:', err);
			throw new Error('Unknown error input when creating TestaUtils.cleanError() output');
		})();

	// For now this is just a wrapper around `NPM:clean-stack` but could change in the future
	let trace = cleanStack(errObject.stack, {
		pretty: settings.pretty,
		basePath: settings.cwd,
		pathFilter: path => !path.startsWith(TestaBase.testaPath),
	});

	if (settings.indent) { // Apply indent?
		trace = trace
			.split(/\n/)
			.map(line => settings.indent + line)
			.join('\n');
	}

	return trace;
}


/**
* Guess the location of the line of code that called this function
*
* @returns {Object?} A location object or null if there is insufficient information
* @property {String} file File path relative to `TestaBase.basePath`
* @property {Number} line The line offset within the file
* @property {Number} column The column offset within the file
*/
export function getLocation() {
	// NOTE:
	// #0 is always the (fake error)
	// #1 is always this function
	let stack = new Error('TestaUtils.getCallerInfo()').stack.split(/\n/).slice(2);

	// Find first non-Testa / non-node internal line
	let callerLine = stack.find(l => !/(@momsfriendlydevco\/testa|node:internal\/modules)/.test(l));

	let match = callerLine.match(/\((.+):(\d+):(\d+)\)/) || callerLine.match(/at (.+):(\d+):(\d+)/);

	return (
		match ? {
			file: pathRelative(
				TestaBase.basePath,
				match[1].replace(/^file:\/\//, ''),
			),
			line: match[2],
			column: match[3]
		}
		: null
	);
}



/**
* Nicely format a raw number of bytes into a file size
*
* @param {value} bytes The input value to format
*
* @param {Object} [options] Additional options to mutate behaviour
* @param {Number} [options.decimals=2] Desired number of decimal places
* @param {Number} [options.base=1024] The number base to use when calculating
* @param {Array<String>} [options.sizes] Asending array of calssification sizes
*
* @returns {String} Human readable number
*/
export function formatSize(bytes, options) {
	let settings = {
		decimals: 2,
		base: 1024,
		sizes: ['Bytes', 'KB', 'MB', 'GB', 'TB'],
		...options,
	};

	if (bytes === 0) return '0 Bytes';
	const i = Math.floor(Math.log(bytes) / Math.log(settings.base));
	return parseFloat((bytes / Math.pow(settings.base, i)).toFixed(settings.decimals)) + ' ' + settings.sizes[i];
}
