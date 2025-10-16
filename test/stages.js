import test from '#testa';

test('stages', async (t) => {
	t.stage('One!');
	await t.wait('100ms');

	t.stage('Two!');
	await t.wait('100ms');

	t.stage('Three!');
	await t.wait('100ms');

	t.stage('Done!');
});
