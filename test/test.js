import {test, expect} from '#testa';

test('simple test', ()=> {
	expect(1).to.be.ok;
	expect(1).to.be.a('number');
});

test.skip('simple broken test', ()=> {
	expect(1).to.be.a('string');
});

test.id('foo', t => {
	t.log('Foo!');
});

test.id('bar').depends('foo', t => {
	t.log('Bar!');
});

test.id('baz').depends('baz', t => {
	t.log('Baz!');
});

test.exec();
