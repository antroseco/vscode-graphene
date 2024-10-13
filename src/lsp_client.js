const language_client = require("vscode-languageclient/node");
const vscode = require("vscode");
const fs = require("fs");

/** @type {language_client.LanguageClient?} */
let client = null;

function start() {
    let config = vscode.workspace.getConfiguration("graphene.languageServer");

    if (!config.get("enable", false)) {
        // Language server is disabled.
        return;
    }

    if (!config.has("path")) {
        // Path not available.
        vscode.window.showWarningMessage("Language server is enabled but the path is not set");
        return;
    }

    const path = config.get("path");
    try {
        fs.accessSync(path, fs.constants.R_OK | fs.constants.X_OK);
    }
    catch {
        // Bad path, this check is for the user's convenience only.
        vscode.window.showErrorMessage(`Invalid language server path: '${path}'`);
        return;
    }

    /** @type {language_client.ServerOptions} */
    const server_options = {
        run: {
            command: path,
            transport: language_client.TransportKind.pipe,
        },
        debug: {
            command: path,
            transport: language_client.TransportKind.pipe,
        },
    };

    /** @type {language_client.LanguageClientOptions} */
    const client_options = {
        documentSelector: [{ scheme: "file", language: "graphene" }],
        errorHandler: {
            error: (error, _message, _count) => {
                client.error(`Language server sent an invalid response: '${error}'`);
                return {
                    "action": language_client.ErrorAction.Continue
                };
            },
            closed: () => {
                return {
                    "action": language_client.CloseAction.DoNotRestart
                };
            }
        }
    };

    client = new language_client.LanguageClient(
        "GrapheneLanguageServer",
        "Graphene",
        server_options,
        client_options
    );

    // Start the client. This will also launch the server.
    return client.start();
}

function stop() {
    if (client === null) {
        return undefined;
    }
    return client.stop();
}

/** @param {language_client.ExtensionContext} _context */
function activate(_context) {
    vscode.workspace.onDidChangeConfiguration(async event => {
        if (event.affectsConfiguration("graphene.languageServer")) {
            await stop();
            return start();
        }
    });

    return start();
}

function deactivate() {
    return stop();
}

module.exports = { activate, deactivate };
