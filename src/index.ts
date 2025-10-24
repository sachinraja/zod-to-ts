import ts, { factory as f } from 'typescript'
import type * as z4 from 'zod/v4/core'
import {
	addJsDocComment,
	createTypeReferenceFromString,
	getIdentifierOrStringLiteral,
} from './ast-helpers'
import {
	type ResolvedZodToTsOptions,
	resolveOptions,
	type ZodToTsOptions,
} from './types'
import { handleUnrepresentable, literalValueToLiteralType } from './utils'

function callTypeOverride(schema: z4.$ZodType, options: ZodToTsOptions) {
	const getTypeOverride = options.overrides?.get(schema)
	if (!getTypeOverride) return

	return getTypeOverride(ts, options)
}

function withAuxiliaryType(
	schema: z4.$ZodType,
	getInner: () => ts.TypeNode,
	options: ResolvedZodToTsOptions,
) {
	const auxiliaryTypeDefinition: InternalAuxiliaryTypeDefinition = {
		identifier: f.createIdentifier(options.auxiliaryTypeStore.nextId()),
	}
	const internalDefinitionsMap = options.auxiliaryTypeStore.definitions as Map<
		z4.$ZodType,
		InternalAuxiliaryTypeDefinition
	>
	internalDefinitionsMap.set(schema, auxiliaryTypeDefinition)

	const node = getInner()

	if (auxiliaryTypeDefinition.used) {
		auxiliaryTypeDefinition.node = f.createTypeAliasDeclaration(
			undefined,
			auxiliaryTypeDefinition.identifier,
			undefined,
			node,
		)

		return f.createTypeReferenceNode(auxiliaryTypeDefinition.identifier)
	}

	internalDefinitionsMap.delete(schema)
	return node
}

interface InternalAuxiliaryTypeDefinition {
	identifier: ts.Identifier
	node?: ts.TypeAliasDeclaration
	used?: boolean
}

export function zodToTs(zod: z4.$ZodType, options: ZodToTsOptions) {
	const resolvedOptions = resolveOptions(options)

	const node = zodToTsNode(zod, resolvedOptions)

	return { node }
}

function zodToTsNode(
	schema: z4.$ZodType,
	options: ResolvedZodToTsOptions,
): ts.TypeNode {
	const def = (schema as z4.$ZodTypes)._zod.def

	const typeOverride = callTypeOverride(schema, options)
	if (typeOverride) return typeOverride

	const auxiliaryTypeDefinition =
		options.auxiliaryTypeStore.definitions.get(schema)
	if (auxiliaryTypeDefinition) {
		;(auxiliaryTypeDefinition as InternalAuxiliaryTypeDefinition).used = true
		return f.createTypeReferenceNode(auxiliaryTypeDefinition.identifier)
	}

	switch (def.type) {
		case 'string': {
			return f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
		}
		case 'nan':
		case 'number': {
			return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
		}
		case 'bigint': {
			return f.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword)
		}
		case 'success':
		case 'boolean': {
			return f.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
		}
		case 'date': {
			return createTypeReferenceFromString('Date')
		}
		case 'undefined': {
			return f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
		}
		case 'null': {
			return f.createLiteralTypeNode(f.createNull())
		}
		case 'void': {
			return f.createUnionTypeNode([
				f.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
				f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
			])
		}
		case 'any': {
			return f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
		}
		case 'unknown': {
			return f.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
		}
		case 'never': {
			return f.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword)
		}
		case 'lazy': {
			return withAuxiliaryType(
				schema,
				() => zodToTsNode(def.getter(), options),
				options,
			)
		}
		case 'literal': {
			// z.literal(['hi', 'bye']) -> 'hi' | 'bye'

			const members = def.values.map((value) =>
				literalValueToLiteralType(value),
			)

			if (members.length === 1) {
				return members[0]
			}

			return f.createUnionTypeNode(members)
		}
		case 'object': {
			return withAuxiliaryType(
				schema,
				() => {
					const properties = Object.entries(def.shape)

					const members: ts.TypeElement[] = properties.map(
						([key, memberZodSchema]) => {
							const type = zodToTsNode(memberZodSchema, options)
							const isOptional =
								options.io === 'input'
									? memberZodSchema._zod.optin
									: memberZodSchema._zod.optout

							const propertySignature = f.createPropertySignature(
								undefined,
								getIdentifierOrStringLiteral(key),
								isOptional
									? f.createToken(ts.SyntaxKind.QuestionToken)
									: undefined,
								type,
							)

							const description =
								options.metadataRegistry?.get(memberZodSchema)?.description
							if (description) {
								addJsDocComment(propertySignature, description)
							}

							return propertySignature
						},
					)

					if (def.catchall) {
						const catchallType = zodToTsNode(def.catchall, options)
						members.push(
							f.createIndexSignature(
								undefined,
								[
									f.createParameterDeclaration(
										undefined,
										undefined,
										f.createIdentifier('x'),
										undefined,
										f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
									),
								],
								catchallType,
							),
						)
					}

					return f.createTypeLiteralNode(members)
				},
				options,
			)
		}

		case 'array': {
			const type = zodToTsNode(def.element, options)
			const node = f.createArrayTypeNode(type)
			return node
		}

		case 'enum': {
			// z.enum(['a', 'b', 'c']) -> 'a' | 'b' | 'c
			const members = Object.values(def.entries).map((value) =>
				literalValueToLiteralType(value),
			)
			return f.createUnionTypeNode(members)
		}

		case 'union': {
			// z.union([z.string(), z.number()]) -> string | number
			const types: ts.TypeNode[] = def.options.map((option) =>
				zodToTsNode(option, options),
			)
			return f.createUnionTypeNode(types)
		}

		case 'optional': {
			const innerType = zodToTsNode(def.innerType, options)
			return f.createUnionTypeNode([
				innerType,
				f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
			])
		}

		case 'nullable': {
			const innerType = zodToTsNode(def.innerType, options)
			return f.createUnionTypeNode([
				innerType,
				f.createLiteralTypeNode(f.createNull()),
			])
		}

		case 'tuple': {
			// z.tuple([z.string(), z.number()]) -> [string, number]
			const types = def.items.map((option) => zodToTsNode(option, options))
			return f.createTupleTypeNode(types)
		}

		case 'record': {
			// z.record(z.number()) -> { [x: string]: number }
			const keyType = zodToTsNode(def.keyType, options)
			const valueType = zodToTsNode(def.valueType, options)

			const node = f.createTypeLiteralNode([
				f.createIndexSignature(
					undefined,
					[
						f.createParameterDeclaration(
							undefined,
							undefined,
							f.createIdentifier('key'),
							undefined,
							keyType,
						),
					],
					valueType,
				),
			])

			return node
		}

		case 'map': {
			// z.map(z.string()) -> Map<string>
			const keyType = zodToTsNode(def.keyType, options)
			const valueType = zodToTsNode(def.valueType, options)

			const node = f.createTypeReferenceNode(f.createIdentifier('Map'), [
				keyType,
				valueType,
			])

			return node
		}

		case 'set': {
			// z.set(z.string()) -> Set<string>
			const type = zodToTsNode(def.valueType, options)

			const node = f.createTypeReferenceNode(f.createIdentifier('Set'), [type])
			return node
		}

		case 'intersection': {
			// z.number().and(z.string()) -> number & string
			const left = zodToTsNode(def.left, options)
			const right = zodToTsNode(def.right, options)
			const node = f.createIntersectionTypeNode([left, right])
			return node
		}

		case 'promise': {
			// z.promise(z.string()) -> Promise<string>
			const type = zodToTsNode(def.innerType, options)

			const node = f.createTypeReferenceNode(f.createIdentifier('Promise'), [
				type,
			])

			return node
		}

		case 'function': {
			// z.function({ input: [z.string()], output: z.number() }) -> (args_0: string) => number
			const argumentSchemas = (def.input as z4.$ZodTuple)._zod.def.items
			const parameterTypes = argumentSchemas.map((argument, index: number) => {
				const parameterType = zodToTsNode(argument, options)

				return f.createParameterDeclaration(
					undefined,
					undefined,
					f.createIdentifier(`args_${index}`),
					undefined,
					parameterType,
				)
			})

			const returnType = zodToTsNode(def.output, options)

			const node = f.createFunctionTypeNode(
				undefined,
				parameterTypes,
				returnType,
			)

			return node
		}

		case 'prefault':
		case 'default': {
			// z.string().optional().default('hi') -> string
			// if it's an input type, the type is optional
			if (options.io === 'input') {
			}
			return zodToTsNode(def.innerType, options)
		}
		case 'file': {
			return createTypeReferenceFromString('File')
		}
		case 'pipe': {
			const innerType =
				options.io === 'input'
					? def.in._zod.def.type === 'transform'
						? def.out
						: def.in
					: def.out
			return zodToTsNode(innerType, options)
		}
		case 'readonly': {
			const innerType = zodToTsNode(def.innerType, options)
			if (ts.isArrayTypeNode(innerType) || ts.isTupleTypeNode(innerType)) {
				return f.createTypeOperatorNode(
					ts.SyntaxKind.ReadonlyKeyword,
					innerType,
				)
			}

			if (ts.isTypeLiteralNode(innerType)) {
				const members = innerType.members.map((member) => {
					if (ts.isPropertySignature(member)) {
						return f.updatePropertySignature(
							member,
							[
								...(member.modifiers ?? []),
								f.createToken(ts.SyntaxKind.ReadonlyKeyword),
							],
							member.name,
							member.questionToken,
							member.type,
						)
					}
					return member
				})

				return f.createTypeLiteralNode(members)
			}

			if (
				ts.isTypeReferenceNode(innerType) &&
				ts.isIdentifier(innerType.typeName)
			) {
				const identifier = innerType.typeName.text
				if (identifier === 'Set')
					return f.createTypeReferenceNode(
						f.createIdentifier('ReadonlySet'),
						innerType.typeArguments,
					)

				if (identifier === 'Map')
					return f.createTypeReferenceNode(
						f.createIdentifier('ReadonlyMap'),
						innerType.typeArguments,
					)
			}

			// fall back to just returning the inner type
			return innerType
		}
		case 'catch': {
			// z.string().catch('default') -> string
			return zodToTsNode(def.innerType, options)
		}
		case 'nonoptional': {
			// z.string().optional().nonoptional() -> Exclude<string | undefined, undefined> -> string
			return f.createTypeReferenceNode('Exclude', [
				zodToTsNode(def.innerType, options),
				f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
			])
		}
		case 'symbol': {
			return f.createKeywordTypeNode(ts.SyntaxKind.SymbolKeyword)
		}
		case 'template_literal': {
			const partNodes = def.parts.map((part) => {
				if (typeof part !== 'object' || part === null) {
					return literalValueToLiteralType(part)
				}
				return zodToTsNode(part, options)
			})

			let templateHead: ts.TemplateHead | undefined

			const templateSpans: ts.TemplateLiteralTypeSpan[] = []
			let currentTypeSpanNode: ts.TypeNode | undefined
			let currentMiddle = ''
			for (const node of partNodes) {
				if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) {
					currentMiddle += node.literal.text
					continue
				}

				if (currentTypeSpanNode) {
					const templateSpan = f.createTemplateLiteralTypeSpan(
						currentTypeSpanNode,
						f.createTemplateMiddle(currentMiddle),
					)

					templateSpans.push(templateSpan)
				} else {
					// if it's the first, set the head
					templateHead = f.createTemplateHead(currentMiddle)
					currentTypeSpanNode = node
				}

				currentMiddle = ''
				currentTypeSpanNode = node
			}

			if (templateHead && currentTypeSpanNode) {
				const templateSpan = f.createTemplateLiteralTypeSpan(
					currentTypeSpanNode,
					f.createTemplateTail(currentMiddle),
				)
				templateSpans.push(templateSpan)
			} else {
				return f.createLiteralTypeNode(
					f.createNoSubstitutionTemplateLiteral(currentMiddle),
				)
			}

			return f.createTemplateLiteralType(templateHead, templateSpans)
		}
	}

	return handleUnrepresentable(options.unrepresentable, def.type)
}

export { createTypeAlias, printNode } from './ast-helpers'
export type { TypeOverrideMap, ZodToTsOptions } from './types'
export { createAuxiliaryTypeStore } from './utils'
