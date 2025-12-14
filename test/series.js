import {test, expect} from '#testa';

let runOrder = [];
test.id('series-foo').series().do(async (t) => {
	await t.wait(300);
	t.log('Foo!');
	runOrder.push('foo');
	expect(runOrder).to.deep.equal(['foo']);
});


test.id('series-bar').series().do(async (t) => {
	await t.wait(200);
	t.log('Bar!');
	runOrder.push('bar');
	expect(runOrder).to.deep.equal(['foo', 'bar']);
});


test.id('series-baz').series().do(async (t) => {
	await t.wait(300);
	runOrder.push('baz');
	expect(runOrder).to.deep.equal(['foo', 'bar', 'baz']);
});
