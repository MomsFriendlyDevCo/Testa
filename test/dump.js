import test from '#testa';

test('dump test', t => {
	t.dump({
		foo: 'Foo!',
		bar: 'Bar!',
		baz: [1, 2, 3],
	});
});
