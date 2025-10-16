import cleanStack from 'clean-stack';
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
