import test, {expect} from '#testa';

test('skip before starting (no handler)').skip();

test('skip before starting (no handler + reason)').skip('static skip');

/*
test('skip before starting (w/handler)').skip(()=> {
	expect.fail;
});
*/

test('skip before starting (w/handler + reason)').skip('static skip + handler').do(()=> {
	expect.fail;
});

test('skip after starting (via context)', t => {
	t.skip();
});

test('skip after starting (via context + reason)', t => {
	t.skip('dynamic skip');
});
