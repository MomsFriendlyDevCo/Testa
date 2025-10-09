import {test, expect} from '#testa';

let hasBaz = false;
test.id('baz').depends('bar').do(t => {
	hasBaz = true;
	expect(hasBar).to.be.true;
	t.log('Baz!');
});


let hasBar = false;
test.id('bar').depends('foo').do(t => {
	hasBar = true;
	expect(hasFoo).to.be.true;
	t.log('Bar!');
});


let hasFoo = false;
test.id('foo').do(t => {
	hasFoo = true;
	t.log('Foo!');
});
