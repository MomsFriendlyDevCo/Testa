import test from '#testa';

test('dump test', t => {
	t.dump({
		foo: 'Foo!',
		bar: 'Bar!',
		baz: [1, 2, 3],
	});
});


test('dump test (symetric / sorted keys)', t => {
	t.dump({
		foo: 'Foo!',
		bar: 'Bar!',
		baz: [1, 2, 3],
	}, {symetric: true});
});
