import ts from 'typescript'
import { ZodTypeAny } from 'zod'
import { GetType, GetTypeFunction } from './types'
const { factory: f, SyntaxKind, ScriptKind, ScriptTarget, EmitHint } = ts

export const maybeIdentifierToTypeReference = (identifier: ts.Identifier | ts.TypeNode) => {
	if (ts.isIdentifier(identifier)) {
		return f.createTypeReferenceNode(identifier)
	}

	return identifier
}

export const createTypeReferenceFromString = (identifier: string) =>
	f.createTypeReferenceNode(f.createIdentifier(identifier))

export const createUnknownKeywordNode = () => f.createKeywordTypeNode(SyntaxKind.UnknownKeyword)

export const createTypeAlias = (node: ts.TypeNode, identifier: string, comment?: string) => {
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

export const printNode = (node: ts.Node, printerOptions?: ts.PrinterOptions) => {
	const sourceFile = ts.createSourceFile('print.ts', '', ScriptTarget.Latest, false, ScriptKind.TS)
	const printer = ts.createPrinter(printerOptions)
	return printer.printNode(EmitHint.Unspecified, node, sourceFile)
}

export const withGetType = <T extends ZodTypeAny & GetType>(schema: T, getType: GetTypeFunction): T => {
	schema.getType = getType
	return schema
}

const identifierRE = /^[$A-Z_a-z][\w$]*$/

export const getIdentifierOrStringLiteral = (string_: string) => {
	if (identifierRE.test(string_)) {
		return f.createIdentifier(string_)
	}

	return f.createStringLiteral(string_)
}

export const addJsDocComment = (node: ts.Node, text: string) => {
	ts.addSyntheticLeadingComment(node, SyntaxKind.MultiLineCommentTrivia, `* ${text} `, true)
}
