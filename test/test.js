import {test, expect} from '#testa';

test('simple test', ()=> {
	expect(1).to.be.ok;
	expect(1).to.be.a('number');
});


test.skip('simple broken test', ()=> {
	expect(1).to.be.a('string');
});
