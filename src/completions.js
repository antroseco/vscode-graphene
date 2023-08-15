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

    const sn_provider = vscode.languages.registerCompletionItemProvider("graphene", {
        provideCompletionItems(document, position, token, context) {
            const for_sn = new vscode.CompletionItem(
                { label: "for", description: "Code snippet for for loop" }
            );
            for_sn.insertText = new vscode.SnippetString(
                "for ${1:i} in ${2:iterator} {\n\t${0:$BLOCK_COMMENT_START code $BLOCK_COMMENT_END}\n}"
            );

            const for_range_sn = new vscode.CompletionItem(
                { label: "forrange", description: "Code snippet for range-based for loop" }
            );
            for_range_sn.insertText = new vscode.SnippetString(
                "for ${1:i} in range(${2:upper}) {\n\t${0:$BLOCK_COMMENT_START code $BLOCK_COMMENT_END}\n}"
            );

            return [for_sn, for_range_sn]
        }
    });

    context.subscriptions.push(kw_provider, sn_provider);
}


module.exports = { activate };
