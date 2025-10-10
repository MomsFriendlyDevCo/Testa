#!/usr/bin/env node

import {glob} from 'node:fs/promises';
import {join as pathJoin} from 'node:path';
import {program} from 'commander'
import TestaBase from '#testa/base';

// Parse Command line
let args = program
	.name('testa')
	.description('Run testkits in parallel with dependencies')
	.argument('[files...]')
	.option('-b, --bail', 'Stop processing on the first error')
	.option('-s, --serial', 'Force run tests in serial (alias of `--limit 1`)')
	.option('-l, --limit <number>', 'Set number of tests to run in parallel', 5)
	.option('-g, --grep <expression>', 'Add a grep expression filter for tests titles + IDs (can be specified multiple times)', (v, t) => t.concat([v]), [])
	.option('-f, --fgrep <expression>', 'Add a raw string expression filter for tests titles + IDs (can be specified multiple times)', (v, t) => t.concat([v]), [])
	.option('--slow [timestring]', 'Set the amount of time before a test is considered slow to resolve. Can be any valid timestring', '75ms')
	.option('--timeout [timestring]', 'Set the amount of time before a test times out. Can be any valid timestring', '2s')
	.option('--debug', 'Turn on various internal debugging output')
	.parse(process.argv);

args = { // Flatten into POJO of option keys + `args:Array<String>`
	...args.opts(),
	args: args.args,
};

// Populate options
if (args.serial) Object.assign(args, {limit: 1});
TestaBase.concurrency = args.limit;
TestaBase.debug = !! args.debug;
TestaBase.bail = !! args.bail;
TestaBase.slow = args.slow;
TestaBase.timeout = args.timeout;
if (args.grep.length > 0) TestaBase.filters = TestaBase.filters.concat(
	args.grep.map(g => test => {
		let re = new RegExp(g, 'i');
		return re.test(test._name) || re.test(test._id);
	})
);
if (args.fgrep.length > 0) TestaBase.filters = TestaBase.filters.concat(
	args.fgrep.map(g => test => {
		let re = new RegExp(RegExp.escape(g), 'i');
		return re.test(test._name) || re.test(test._id);
	})
);

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

// Run all queued tests
await TestaBase.execAll();
