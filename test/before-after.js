import {test, expect, after} from '#testa';

let runBefore = 0;
test.before('before test', ()=> {
	runBefore++;
});

let runAfter = 0;
test.before('after test', ()=> {
	runAfter++;
});

after(()=> {
	expect(runBefore).to.equal(1);
	expect(runAfter).to.equal(1);
});
