#!/usr/bin/env node
import {program} from 'commander'
import testa from '#testa';

// Parse Command line
let args = program
	.name('testa')
	.description('Run testkits in parallel with dependencies')
	.argument('[files...]')
	.option('-l, --limit <number>', 'Set number of tests to run in parallel')
	.parse(process.argv);

args = { // Flatten into POJO of option keys + `args:Array<String>`
	...args.opts(),
	args: args.args,
};

await Promise.all(
	args.args.map(file =>
		import(file)
	)
);
console.log({args});
