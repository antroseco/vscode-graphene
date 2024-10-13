const language_client = require("vscode-languageclient/node");
const vscode = require("vscode");
const fs = require("fs");

/** @type {language_client.LanguageClient?} */
let client = null;

/**
 * @param {vscode.WorkspaceConfiguration} config
 * @param {string} identifier
 * @param {string} name
 * @returns {string | undefined}
 */
function get_path_from_config(config, identifier, name) {
    if (!config.has(identifier)) {
        // Path not available.
        vscode.window.showWarningMessage(`Language server is enabled but the ${name} path is not set`);
        return undefined;
    }

    const path = config.get(identifier);
    try {
        fs.accessSync(path, fs.constants.R_OK | fs.constants.X_OK);
    }
    catch {
        // Bad path, this check is for the user's convenience only.
        vscode.window.showErrorMessage(`Invalid ${name} path: '${path}'`);
        return undefined;
    }

    return path;
}

async function start() {
    let config = vscode.workspace.getConfiguration("graphene.languageServer");

    if (!config.get("enable", false)) {
        // Language server is disabled.
        return;
    }

    const server_path = get_path_from_config(config, "serverPath", "server");
    const parser_path = get_path_from_config(config, "parserPath", "parser");

    if (server_path === undefined || parser_path === undefined) {
        return;
    }

    /** @type {language_client.Executable} */
    const executable = {
        command: server_path,
        transport: language_client.TransportKind.pipe,
        args: [`--parser=${parser_path}`]
    };

    /** @type {language_client.ServerOptions} */
    const server_options = {
        run: executable,
        debug: executable,
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

async function stop() {
    if (client === null) {
        return undefined;
    }
    return client.stop();
}

/** @param {language_client.ExtensionContext} _context */
async function activate(_context) {
    vscode.workspace.onDidChangeConfiguration(async event => {
        if (event.affectsConfiguration("graphene.languageServer")) {
            await stop();
            return start();
        }
    });

    return start();
}

async function deactivate() {
    return stop();
}

module.exports = { activate, deactivate };
