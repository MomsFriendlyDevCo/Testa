import test, {expect} from '#testa';

test('fail due to expect() logic').do(()=> {
	try {
		expect(1).to.not.be.ok;
	} catch (e) {
		expect.fail;
	}
});

test('double failure').skip('TODO: not yet handled right').do(()=> {
	setTimeout(()=> {
		throw new Error('Second fail');
	}, 100);

	expect(1).to.not.be.ok;
});
