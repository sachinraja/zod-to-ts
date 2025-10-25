import ts, { factory as f } from 'typescript'
import type * as z4 from 'zod/v4/core'
import type { AuxiliaryTypeStore, ZodToTsOptions } from './types'

export function handleUnrepresentable(
	unrepresentable: ZodToTsOptions['unrepresentable'],
	unrepresentableType: string,
) {
	if (unrepresentable === 'any') {
		return f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
	}

	throw new Error(
		`Schemas of type "${unrepresentableType}" cannot be represented in TypeScript`,
	)
}

export function createAuxiliaryTypeStore(): AuxiliaryTypeStore {
	let id = 0
	return {
		nextId() {
			const currentId = id
			id++
			return `Auxiliary_${currentId}`
		},
		definitions: new Map(),
	}
}

export function literalValueToLiteralType(literalValue: z4.util.Literal) {
	switch (typeof literalValue) {
		case 'string':
			return f.createLiteralTypeNode(f.createStringLiteral(literalValue))
		case 'number':
			if (literalValue < 0) {
				return f.createLiteralTypeNode(
					f.createPrefixUnaryExpression(
						ts.SyntaxKind.MinusToken,
						f.createNumericLiteral(Math.abs(literalValue)),
					),
				)
			}
			return f.createLiteralTypeNode(f.createNumericLiteral(literalValue))
		case 'bigint':
			return f.createLiteralTypeNode(
				f.createBigIntLiteral(`${literalValue.toString()}n`),
			)
		case 'boolean':
			return literalValue === true
				? f.createLiteralTypeNode(f.createTrue())
				: f.createLiteralTypeNode(f.createFalse())
		case 'object':
			if (literalValue === null) return f.createLiteralTypeNode(f.createNull())
			throw new Error('Object literals are not supported')
		case 'undefined':
			return f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
	}
}
