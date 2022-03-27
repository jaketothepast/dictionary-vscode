// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fetch = require('node-fetch');

let cache = null;

/**
 * createHoverText will return a list of markdown formatted strings for hover.
 * 
 * @param {*} text Text that was originally hovered upon
 * @param {*} meanings The meanings returned by the dictionary, to be formatted
 * @returns A markdown formattd string array
 */
function createHoverText(text, meanings) {
	let hoverText = [];
	hoverText.push(`# ${text}`);

	meanings?.map((meaning) => {
		hoverText.push(`## ${meaning.partOfSpeech}`);
		meaning?.definitions.map((definition) => hoverText.push(definition.definition));
	});

	return hoverText;
}

/**
 * getTextDefinitions will check the cache first, then hit the API for dictionary data.
 * 
 * @param {*} text Text that we are checking the cache for, and hitting the text API
 * @returns The data from the API
 */
async function getTextDefinitions(text) {
	const cached = cache.get(text);

	// We found the word in the cache, 
	if (typeof cached !== 'undefined') {
		console.log('cache hit ' + text);
		return cached;
	}

	// We did not find the word in the cache, go get the info
	const apiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
	let res;
	try {
		res = await fetch(apiUrl + text);
	} catch(e) {
		console.log(e);
	}


	let data = await res.json();
	cache.update(text, data);
	
	return data;

}

/**
 * getHoverText returns a hover text
 * @param {*} text The text we are creating a hover for
 * @returns Markdown formatted text
 */
async function getHoverText(text) {
	text = text.toLowerCase();
	let data = await getTextDefinitions(text);
	// TODO: Check cache
	console.log("checking hover " + text);

	let word = data[0];

	if (word?.title === 'No Definitions Found') {
		return null;
	}

	// We are certain we have definitions, create the hover text
	return createHoverText(text, word.meanings);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Congratulations, your extension "dictionary" is now active!');

	// Create our singleton cache instance.
	if (cache === null) {
		cache = context.globalState;
	}

	// Our synonym handler, that will show the quick pick menu and replace the selection with whatever synonym is desired.
	const synonymHandler = async (args) => {
		console.log(args);
		const editor = vscode.window.activeTextEditor;
		const selection = editor.document.getText(editor.selection);

		const item = cache.get(selection);
		 
		if (typeof item === 'undefined' || item.length < 1) {
			vscode.window.showInformationMessage('No synonyms found for ' + selection);
			return;
		}

		let synonyms = [];
		item[0].meanings.forEach((meaning) => {
			meaning.synonyms.forEach((synonym) => {
				synonyms.push(synonym);
			});
		});

		synonyms.unshift(selection);
		vscode.window.showQuickPick(synonyms).then((strings) => {
			console.log(strings);
			editor.edit(editBuilder => editBuilder.replace(editor.selection, strings));
		});
	}
	// Define our commands.
	let subscriptions =
		[vscode.languages.registerHoverProvider('markdown', {
			async provideHover(document, position, token) {
				const wordRange = document.getWordRangeAtPosition(position);
				const word = document.getText(wordRange);
				const text = await getHoverText(word);
				return new vscode.Hover(text);
			}
		}),
		vscode.commands.registerCommand('dictionary.synonyms', synonymHandler)];

	// context.subscriptions.push(disposable);
	subscriptions.map((sub) => context.subscriptions.push(sub));
}

// this method is called when your extension is deactivated
function deactivate() {}

// Export functions
module.exports = {
	activate,
	deactivate,
	createHoverText,
	getHoverText
}
