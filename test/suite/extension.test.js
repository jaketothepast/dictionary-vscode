const assert = require('assert');

const sinon = require('sinon');
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
// const proxyquire = require('proxyquire');
// const fetchSpy = require('sinon').spy(require('node-fetch'));

// Mock node-fetch
// const myExtension = proxyquire('../extension',
// 	{ 'node-fetch': fetchSpy });
global.cache = sinon.stub();
const myExtension = require('../../extension');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Returns correct text', () => {
		const input = [
			"hello",
			[{partOfSpeech: 'noun', definitions: [{definition: 'hey'}]},
			 {partOfSpeech: 'verb', definitions: [{definition: 'hi'}]}]
		];

		const output = [
			'# hello',
			'## noun',
			'hey',
			'## verb',
			'hi'
		];

		assert.deepStrictEqual(myExtension.createHoverText(...input), output);
	});


});
