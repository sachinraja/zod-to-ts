import { SyntaxKind, TokenFlags } from 'typescript/unstable/ast'
import * as f from 'typescript/unstable/ast/factory'
import type * as z4 from 'zod/v4/core'
import type { AuxiliaryTypeStore, ZodToTsOptions } from './types'

export function handleUnrepresentable(
	unrepresentable: ZodToTsOptions['unrepresentable'],
	unrepresentableType: string,
) {
	if (unrepresentable === 'any') {
		return f.createKeywordTypeNode(SyntaxKind.AnyKeyword)
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
			return f.createLiteralTypeNode(
				f.createStringLiteral(literalValue, TokenFlags.None),
			)
		case 'number':
			if (literalValue < 0) {
				return f.createLiteralTypeNode(
					f.createPrefixUnaryExpression(
						SyntaxKind.MinusToken,
						f.createNumericLiteral(
							Math.abs(literalValue).toString(),
							TokenFlags.None,
						),
					),
				)
			}
			return f.createLiteralTypeNode(
				f.createNumericLiteral(literalValue.toString(), TokenFlags.None),
			)
		case 'bigint':
			return f.createLiteralTypeNode(
				f.createBigIntLiteral(`${literalValue.toString()}n`, TokenFlags.None),
			)
		case 'boolean':
			return f.createLiteralTypeNode(
				f.createKeywordExpression(
					literalValue ? SyntaxKind.TrueKeyword : SyntaxKind.FalseKeyword,
				),
			)
		case 'object':
			if (literalValue === null)
				return f.createLiteralTypeNode(
					f.createKeywordExpression(SyntaxKind.NullKeyword),
				)
			throw new Error('Object literals are not supported')
		case 'undefined':
			return f.createKeywordTypeNode(SyntaxKind.UndefinedKeyword)
	}
}
