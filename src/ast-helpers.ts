import {
	isTypeLiteralNode,
	type Node,
	SyntaxKind,
	TokenFlags,
	type TypeElement,
	type TypeNode,
} from 'typescript/unstable/ast'
import * as f from 'typescript/unstable/ast/factory'
import { visitEachChild } from 'typescript/unstable/ast/visitor'
import { API, Emitter, type PrintNodeOptions } from 'typescript/unstable/sync'

/** The subset of the TypeScript 7 API handed to override functions */
export const typescript = { factory: f, SyntaxKind, TokenFlags }
export type TypeScriptApi = typeof typescript

export function createTypeReferenceFromString(identifier: string) {
	return f.createTypeReferenceNode(f.createIdentifier(identifier))
}

export function createTypeAlias(
	node: TypeNode,
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

let emitter: Emitter | undefined

function getEmitter() {
	if (!emitter) {
		// printing is done by the native compiler, which runs as a child process
		const api = new API()
		// the emitter only needs the client, not a project
		emitter = new Emitter(api['client'])
	}
	return emitter
}

// TypeScript 7 nodes cannot carry synthetic comments, so they are kept here and inserted when printing
const jsDocComments = new WeakMap<Node, string>()

export function addJsDocComment(node: Node, text: string) {
	jsDocComments.set(node, text)
}

export function copyJsDocComment(from: Node, to: Node) {
	const text = jsDocComments.get(from)
	if (text !== undefined) jsDocComments.set(to, text)
}

export function printNode(node: Node, printNodeOptions?: PrintNodeOptions) {
	// each commented member is preceded by a placeholder member that is replaced by the comment after printing
	const comments: string[] = []
	const visit = (node: Node): Node => {
		if (!isTypeLiteralNode(node)) return visitEachChild(node, visit)

		return f.createTypeLiteralNode(
			node.members.flatMap((member): TypeElement[] => {
				const visited = visit(member) as TypeElement
				const text = jsDocComments.get(member)
				if (text === undefined) return [visited]

				comments.push(text)
				const placeholder = f.createPropertySignatureDeclaration(
					undefined,
					f.createIdentifier(`__zodToTsJsDoc${comments.length - 1}__`),
					undefined,
					f.createKeywordTypeNode(SyntaxKind.NeverKeyword),
					undefined!,
				)
				return [placeholder, visited]
			}),
		)
	}

	const printed = getEmitter()
		.printNode(visit(node), printNodeOptions)
		.replace(
			/^([ \t]*)__zodToTsJsDoc(\d+)__: never;/gm,
			// continuation lines of multi-line comments are indented like the member, as the TypeScript 5/6 printer did
			(_, indent: string, index: string) =>
				`${indent}/** ${comments[Number(index)].replaceAll('\n', `\n${indent}`)} */`,
		)

	const rootComment = jsDocComments.get(node)
	return rootComment === undefined
		? printed
		: `/** ${rootComment} */\n${printed}`
}

const identifierRE = /^[$A-Z_a-z][\w$]*$/

export function getIdentifierOrStringLiteral(string_: string) {
	if (identifierRE.test(string_)) {
		return f.createIdentifier(string_)
	}

	return f.createStringLiteral(string_, TokenFlags.None)
}
