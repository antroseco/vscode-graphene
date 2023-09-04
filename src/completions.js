const vscode = require("vscode");

const GRAPHENE_KEYWORDS = [
    "@assignment",
    "@implicit",
    "@operator",
    "@require_once",
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

class GrapheneCompletionItem extends vscode.CompletionItem {
    /**
     * @param {string | vscode.CompletionItemLabel} label
     * @param {vscode.TextDocument} document
     * @param {string} requires
     */
    constructor(label, document, requires) {
        super(label, undefined);

        this.document = document;
        this.requires = requires;
    }
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

            const for_range_sn = new GrapheneCompletionItem(
                { label: "forrange", description: "Code snippet for range-based for loop" },
                document, "std/iterators.c3"
            );
            for_range_sn.insertText = new vscode.SnippetString(
                "for ${1:i} in range(${2:upper}) {\n\t${0:$BLOCK_COMMENT_START code $BLOCK_COMMENT_END}\n}"
            );

            const req_sn = new vscode.CompletionItem(
                { label: "@require", description: "Code snippet for @require_once" }
            );
            req_sn.insertText = new vscode.SnippetString("@require_once \"${1:std/${0}}\"");

            const while_sn = new vscode.CompletionItem(
                { label: "while", description: "Code snippet for while loop" }
            );
            while_sn.insertText = new vscode.SnippetString(
                "while ${1:condition} {\n\t${0:$BLOCK_COMMENT_START code $BLOCK_COMMENT_END}\n}"
            );

            return [for_sn, for_range_sn, req_sn, while_sn]
        },
        /**
         * @param {vscode.CompletionItem | GrapheneCompletionItem} item
         * @param {vscode.CancellationToken} token
         */
        resolveCompletionItem(item, token) {
            // Ignore vanilla completion items.
            if (!(item instanceof GrapheneCompletionItem))
                return item;

            if (!document_requires_path(item.document, item.requires)) {
                if (token.isCancellationRequested)
                    return item;

                const require_once_te = vscode.TextEdit.insert(
                    position_after_last_requires(item.document),
                    `@require_once "${item.requires}"\n`
                );
                item.additionalTextEdits = [require_once_te];
            }

            return item;
        }
    });

    context.subscriptions.push(kw_provider, sn_provider);
}

module.exports = { activate };
