export default async function TestaUIBdd({TestaBase}) {
	// Run all queued tests
	await TestaBase.execAll();
}
