#!/usr/bin/env node

import {glob} from 'node:fs/promises';
import {join as pathJoin} from 'node:path'; // eslint-disable-line unicorn/import-style
import {program} from 'commander'
import {regexpEscape} from './lib/utils.js';
import TestaBase from '#testa/base';

// Parse Command line
let args = program
	.name('testa')
	.description('Run testkits in parallel with dependencies')
	.argument('[files...]')
	.option('-l, --list', 'List all queued tests and exit')
	.option('-b, --bail', 'Stop processing on the first error')
	.option('-s, --serial', 'Force run tests in serial (alias of `--limit 1`)')
	.option('-p, --parallel <number>', 'Set number of tests to run in parallel', 5)
	.option('-g, --grep <expression>', 'Add a grep expression filter for tests titles + IDs (can be specified multiple times)', (v, t) => t.concat([v]), [])
	.option('-f, --fgrep <expression>', 'Add a raw string expression filter for tests titles + IDs (can be specified multiple times)', (v, t) => t.concat([v]), [])
	.option('--slow [timestring]', 'Set the amount of time before a test is considered slow to resolve. Can be any valid timestring', '75ms')
	.option('--timeout [timestring]', 'Set the amount of time before a test times out. Can be any valid timestring', '2s')
	.option('--ui [ui]', 'Set the UI environment to use', 'bdd')
	.option('--debug', 'Turn on various internal debugging output')
	.parse(process.argv);

args = { // Flatten into POJO of option keys + `args:Array<String>`
	...args.opts(),
	args: args.args,
};

// Populate options
if (args.serial) Object.assign(args, {parallel: 1});
TestaBase.concurrency = args.parallel;
TestaBase.debug = !! args.debug;
TestaBase.bail = !! args.bail;
TestaBase.slow = args.slow;
TestaBase.timeout = args.timeout;
// Process --grep [expr] {{{
if (args.grep.length > 0) {
	args.grep.forEach(g => {
		let re = new RegExp(g, 'i');
		if (TestaBase.debug) console.log('Using test grep filter:', re.toString());

		TestaBase.filters.push(test =>
			re.test(test._id) || re.test(test._title)
		);
	});
}
// }}}
// Process --fgrep [str] {{{
if (args.fgrep.length > 0) {
	args.fgrep.forEach(g => {
		let re = new RegExp(regexpEscape(g), 'i');
		if (TestaBase.debug) console.log('Using test grep filter:', re.toString());

		TestaBase.filters.push(test =>
			re.test(test._id) || re.test(test._title)
		);
	});
}
// }}}

// Calculate what files to import
let testFiles = args.args.length > 0
	? args.args // Provided a list - use that
	: await Array.fromAsync(glob('test/*.js')); // Default to globbing from process.cwd()

// Check we have at least one file included
if (testFiles.length == 0)
	throw new Error('No testkit files to run');

// Import all provided files
await Promise.all(
	testFiles.map(path =>
		import(pathJoin(process.cwd(), path))
	)
);

if (args.list) { // LIST MODE - List tests and exit
	console.log('Testa Tests:');
	TestaBase.tests.forEach(test => {
		console.log('-', test.toString());
	});
	process.exit(0);
} else { // RUN MODE - Actually run tests
	// Load the UI
	let {default: ui} = await import(`./ui/${args.ui}.js`);
	await ui({TestaBase});
	process.exit(0);
}
