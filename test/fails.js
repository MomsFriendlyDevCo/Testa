import test, {expect} from '#testa';

test('fail due to expect() logic').do(()=> {
	expect(1).to.not.be.ok;
});

test('fail due to expect().fail').do(()=> {
	expect.fail();
});

test('double failure').skip('TODO: not yet handled right').do(()=> {
	setTimeout(()=> {
		throw new Error('Second fail');
	}, 100);

	expect(1).to.not.be.ok;
});
