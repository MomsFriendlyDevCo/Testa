import test from '#testa';

test('dump test', t => {
	t.dump({
		foo: 'Foo!',
		bar: 'Bar!',
		baz: [1, 2, 3],
	});
});


test('dump test (normalized / sorted keys)', t => {
	t.dump({
		foo: 'Foo!',
		bar: 'Bar!',
		baz: [1, 2, 3],
		quz: {
			moxie: 2,
			flarp: 1,
		},
	}, {normalize: true});
});
