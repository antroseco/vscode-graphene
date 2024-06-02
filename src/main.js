const vscode = require("vscode");
const completions = require("./completions")
const lsp_client = require("./lsp_client");

/** @param {vscode.ExtensionContext} context */
function activate(context) {
    completions.activate(context);
    lsp_client.activate(context);
}

function deactivate() {
    completions.deactivate(context);
    lsp_client.deactivate(context);
}

module.exports = { activate, deactivate };
