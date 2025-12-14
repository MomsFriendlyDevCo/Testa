import {test, expect} from '#testa';

let depSequence = [];
test.id('dep-three').depends('dep-two').do(t => {
	expect(hasTwo).to.be.true;
	depSequence.push('three');
	t.log('three!');
});


let hasTwo = false;
test.id('dep-two').depends('dep-one').do(t => {
	hasTwo = true;
	expect(hasOne).to.be.true;
	depSequence.push('two');
	t.log('two!');
});


let hasOne = false;
test.id('dep-one').do(t => {
	hasOne = true;
	depSequence.push('one');
	t.log('one!');
});

test.depends('dep-one', 'dep-two', 'dep-three').do(()=> {
	expect(depSequence).to.deep.equal(['one', 'two', 'three']);
});
