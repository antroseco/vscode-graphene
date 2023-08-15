const vscode = require("vscode");

const GRAPHENE_KEYWORDS = [
    // These four are missing the leading @, as completions don't seem to
    // trigger when @ is typed.
    "assignment",
    "implicit",
    "operator",
    "require_once",
    // Normal keywords.
    "const",
    "else",
    "for",
    "foreign",
    "function",
    "if",
    "in",
    "let",
    "return",
    "typedef",
    "while",
];

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const kw_provider = vscode.languages.registerCompletionItemProvider("graphene", {
        provideCompletionItems(document, position, token, context) {
            return GRAPHENE_KEYWORDS.map(
                keyword => new vscode.CompletionItem(
                    { label: keyword, description: "Graphene keyword" },
                    vscode.CompletionItemKind.Keyword
                )
            )
        }
    });

    context.subscriptions.push(kw_provider);
}


module.exports = { activate };
