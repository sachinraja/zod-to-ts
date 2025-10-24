import ts, { factory as f } from 'typescript'

export function createTypeReferenceFromString(identifier: string) {
	return f.createTypeReferenceNode(f.createIdentifier(identifier))
}

export function createTypeAlias(
	node: ts.TypeNode,
	identifier: string,
	comment?: string,
) {
	const typeAlias = f.createTypeAliasDeclaration(
		undefined,
		f.createIdentifier(identifier),
		undefined,
		node,
	)

	if (comment) {
		addJsDocComment(typeAlias, comment)
	}

	return typeAlias
}

export function printNode(node: ts.Node, printerOptions?: ts.PrinterOptions) {
	const sourceFile = ts.createSourceFile(
		'print.ts',
		'',
		ts.ScriptTarget.Latest,
		false,
		ts.ScriptKind.TS,
	)
	const printer = ts.createPrinter(printerOptions)
	return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
}

const identifierRE = /^[$A-Z_a-z][\w$]*$/

export function getIdentifierOrStringLiteral(string_: string) {
	if (identifierRE.test(string_)) {
		return f.createIdentifier(string_)
	}

	return f.createStringLiteral(string_)
}

export function addJsDocComment(node: ts.Node, text: string) {
	ts.addSyntheticLeadingComment(
		node,
		ts.SyntaxKind.MultiLineCommentTrivia,
		`* ${text} `,
		true,
	)
}
