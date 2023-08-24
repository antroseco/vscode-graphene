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
 * @param {vscode.TextDocument} document
 * @param {string} path
 */
function document_requires_path(document, path) {
    // XXX this doesn't accept all valid `@require_once` statements; e.g.
    // `@require_once /* comment */ "path"`, but there's not much we can do
    // until we get our own language server to parse the document.
    const regexp = new RegExp(`^\\s*@require_once\\s*"${path}"\\s*$`, "gm");

    return regexp.test(document.getText());
}

/**
 * @param {vscode.TextDocument} document
 */
function position_after_last_requires(document) {
    // Use a negative look-ahead to find the last occurence.
    const regexp = /^(?=\s*)@require_once\s*"[^"]*"(?!.*^\s*@require_once)/sm
    const match = document.getText().match(regexp);

    // No match found, so return the start of the document.
    if (match === null)
        return new vscode.Position(0, 0);

    // Return the line after the last match.
    return document.positionAt(match.index).translate(1);
}

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

            // Automatically include `std/iterators.c3` if it's not already
            // included.
            if (!document_requires_path(document, "std/iterators.c3")) {
                const for_range_te = vscode.TextEdit.insert(
                    position_after_last_requires(document),
                    '@require_once "std/iterators.c3"\n'
                );
                for_range_sn.additionalTextEdits = [for_range_te];
            }

            const req_sn = new vscode.CompletionItem(
                { label: "require", description: "Code snippet for @require_once" }
            );
            req_sn.insertText = new vscode.SnippetString(
                // Note the missing @ prefix, as vscode doesn't count that
                // symbol as part of the currently-typed word. Including it
                // results in `@@require_once`.
                "require_once \"${0:std/}\""
            );

            return [for_sn, for_range_sn, req_sn]
        }
    });

    context.subscriptions.push(kw_provider, sn_provider);
}

module.exports = { activate };
