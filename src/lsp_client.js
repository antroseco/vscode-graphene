const language_client = require("vscode-languageclient/node");

/** @type {language_client.LanguageClient?} */
let client = null;

/** @param {language_client.ExtensionContext} context */
function activate(context) {
    // TODO expose this as a vscode setting.
    const server_command = "/var/home/antros/Source/vscode-graphene/a.out";

    /** @type {language_client.ServerOptions} */
    const server_options = {
        run: {
            command: server_command,
            transport: language_client.TransportKind.pipe,
        },
        debug: {
            command: server_command,
            transport: language_client.TransportKind.pipe,
        },
    };

    /** @type {language_client.clientOptions} */
    const client_options = {
        documentSelector: [{ scheme: "file", language: "graphene" }],
    };

    client = new language_client.LanguageClient(
        "GrapheneLanguageServer",
        "Graphene",
        server_options,
        client_options
    );

    // Start the client. This will also launch the server.
    client.start();
}

function deactivate() {
    if (client === null) {
        return undefined;
    }
    return client.stop();
}

module.exports = { activate, deactivate };
