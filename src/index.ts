import ts from 'typescript'
import { ZodTypeAny } from 'zod'
import {
	GetType,
	GetTypeFunction,
	LiteralType,
	RequiredZodToTsOptions,
	ZodToTsOptions,
	ZodToTsReturn,
	ZodToTsStore,
} from './types'
import {
	addJsDocComment,
	createTypeReferenceFromString,
	createUnknownKeywordNode,
	getIdentifierOrStringLiteral,
	maybeIdentifierToTypeReference,
} from './utils'

const { factory: f, SyntaxKind } = ts

const callGetType = (
	zod: ZodTypeAny & GetType,
	identifier: string,
	options: RequiredZodToTsOptions,
) => {
	let type: ReturnType<GetTypeFunction> | undefined

	// this must be called before accessing 'type'
	if (zod._def.getType) type = zod._def.getType(ts, identifier, options)
	return type
}

export const resolveOptions = (raw?: ZodToTsOptions): RequiredZodToTsOptions => {
	const resolved: RequiredZodToTsOptions = { resolveNativeEnums: true }
	return { ...resolved, ...raw }
}

export const zodToTs = (
	zod: ZodTypeAny,
	identifier?: string,
	options?: ZodToTsOptions,
): ZodToTsReturn => {
	const resolvedIdentifier = identifier ?? 'Identifier'

	const resolvedOptions = resolveOptions(options)

	const store: ZodToTsStore = { nativeEnums: [] }

	const node = zodToTsNode(zod, resolvedIdentifier, store, resolvedOptions)

	return { node, store }
}

const zodToTsNode = (
	zod: ZodTypeAny,
	identifier: string,
	store: ZodToTsStore,
	options: RequiredZodToTsOptions,
) => {
	const typeName = zod._def.typeName

	const getTypeType = callGetType(zod, identifier, options)
	// special case native enum, which needs an identifier node
	if (getTypeType && typeName !== 'ZodNativeEnum') {
		return maybeIdentifierToTypeReference(getTypeType)
	}

	const otherArguments = [identifier, store, options] as const

	switch (typeName) {
		case 'ZodString': {
			return f.createKeywordTypeNode(SyntaxKind.StringKeyword)
		}
		case 'ZodNumber': {
			return f.createKeywordTypeNode(SyntaxKind.NumberKeyword)
		}
		case 'ZodBigInt': {
			return f.createKeywordTypeNode(SyntaxKind.BigIntKeyword)
		}
		case 'ZodBoolean': {
			return f.createKeywordTypeNode(SyntaxKind.BooleanKeyword)
		}
		case 'ZodDate': {
			return f.createTypeReferenceNode(f.createIdentifier('Date'))
		}
		case 'ZodUndefined': {
			return f.createKeywordTypeNode(SyntaxKind.UndefinedKeyword)
		}
		case 'ZodNull': {
			return f.createLiteralTypeNode(f.createNull())
		}
		case 'ZodVoid': {
			return f.createUnionTypeNode([
				f.createKeywordTypeNode(SyntaxKind.VoidKeyword),
				f.createKeywordTypeNode(SyntaxKind.UndefinedKeyword),
			])
		}
		case 'ZodAny': {
			return f.createKeywordTypeNode(SyntaxKind.AnyKeyword)
		}
		case 'ZodUnknown': {
			return createUnknownKeywordNode()
		}
		case 'ZodNever': {
			return f.createKeywordTypeNode(SyntaxKind.NeverKeyword)
		}
		case 'ZodLazy': {
			// it is impossible to determine what the lazy value is referring to
			// so we force the user to declare it
			if (!getTypeType) return createTypeReferenceFromString(identifier)
			break
		}
		case 'ZodLiteral': {
			// z.literal('hi') -> 'hi'
			let literal: ts.LiteralExpression | ts.BooleanLiteral

			const literalValue = zod._def.value as LiteralType
			switch (typeof literalValue) {
				case 'number': {
					literal = f.createNumericLiteral(literalValue)
					break
				}
				case 'boolean': {
					literal = literalValue === true ? f.createTrue() : f.createFalse()
					break
				}
				default: {
					literal = f.createStringLiteral(literalValue)
					break
				}
			}

			return f.createLiteralTypeNode(literal)
		}
		case 'ZodObject': {
			const properties = Object.entries(zod._def.shape())

			const members: ts.TypeElement[] = properties.map(([key, value]) => {
				const nextZodNode = value as ZodTypeAny
				const type = zodToTsNode(nextZodNode, ...otherArguments)

				const { typeName: nextZodNodeTypeName } = nextZodNode._def
				const isOptional = nextZodNodeTypeName === 'ZodOptional';

				const propertySignature = f.createPropertySignature(
					undefined,
					getIdentifierOrStringLiteral(key),
					isOptional ? f.createToken(SyntaxKind.QuestionToken) : undefined,
					type,
				)

				if (nextZodNode.description) {
					addJsDocComment(propertySignature, nextZodNode.description)
				}

				return propertySignature
			})
			return f.createTypeLiteralNode(members)
		}

		case 'ZodArray': {
			const type = zodToTsNode(zod._def.type, ...otherArguments)
			const node = f.createArrayTypeNode(type)
			return node
		}

		case 'ZodEnum': {
			// z.enum['a', 'b', 'c'] -> 'a' | 'b' | 'c
			const types = zod._def.values.map((value: string) => f.createStringLiteral(value))
			return f.createUnionTypeNode(types)
		}

		case 'ZodUnion': {
			// z.union([z.string(), z.number()]) -> string | number
			const options: ZodTypeAny[] = zod._def.options
			const types: ts.TypeNode[] = options.map((option) => zodToTsNode(option, ...otherArguments))
			return f.createUnionTypeNode(types)
		}

		case 'ZodDiscriminatedUnion': {
			// z.discriminatedUnion('kind', [z.object({ kind: z.literal('a'), a: z.string() }), z.object({ kind: z.literal('b'), b: z.number() })]) -> { kind: 'a', a: string } | { kind: 'b', b: number }
			const options: ZodTypeAny[] = [...zod._def.options.values()]
			const types: ts.TypeNode[] = options.map((option) => zodToTsNode(option, ...otherArguments))
			return f.createUnionTypeNode(types)
		}

		case 'ZodEffects': {
			// ignore any effects, they won't factor into the types
			const node = zodToTsNode(zod._def.schema, ...otherArguments) as ts.TypeNode
			return node
		}

		case 'ZodNativeEnum': {
			// z.nativeEnum(Fruits) -> Fruits
			// can resolve Fruits into store and user can handle enums
			let type = getTypeType
			if (!type) return createUnknownKeywordNode()

			if (options.resolveNativeEnums) {
				const enumMembers = Object.entries(zod._def.values as Record<string, string | number>).map(([key, value]) => {
					const literal = typeof value === 'number'
						? f.createNumericLiteral(value)
						: f.createStringLiteral(value)

					return f.createEnumMember(
						getIdentifierOrStringLiteral(key),
						literal,
					)
				})

				if (ts.isIdentifier(type)) {
					store.nativeEnums.push(
						f.createEnumDeclaration(
							undefined,
							type,
							enumMembers,
						),
					)
				} else {
					throw new Error('getType on nativeEnum must return an identifier when resolveNativeEnums is set')
				}
			}

			type = maybeIdentifierToTypeReference(type)

			return type
		}

		case 'ZodOptional': {
			const innerType = zodToTsNode(zod._def.innerType, ...otherArguments) as ts.TypeNode
			return f.createUnionTypeNode([
				innerType,
				f.createKeywordTypeNode(SyntaxKind.UndefinedKeyword),
			])
		}

		case 'ZodNullable': {
			const innerType = zodToTsNode(zod._def.innerType, ...otherArguments) as ts.TypeNode
			return f.createUnionTypeNode([
				innerType,
				f.createLiteralTypeNode(f.createNull()),
			])
		}

		case 'ZodTuple': {
			// z.tuple([z.string(), z.number()]) -> [string, number]
			const types = zod._def.items.map((option: ZodTypeAny) => zodToTsNode(option, ...otherArguments))
			return f.createTupleTypeNode(types)
		}

		case 'ZodRecord': {
			// z.record(z.number()) -> { [x: string]: number }
			const valueType = zodToTsNode(zod._def.valueType, ...otherArguments)

			const node = f.createTypeLiteralNode([f.createIndexSignature(
				undefined,
				[f.createParameterDeclaration(
					undefined,
					undefined,
					f.createIdentifier('x'),
					undefined,
					f.createKeywordTypeNode(SyntaxKind.StringKeyword),
				)],
				valueType,
			)])

			return node
		}

		case 'ZodMap': {
			// z.map(z.string()) -> Map<string>
			const valueType = zodToTsNode(zod._def.valueType, ...otherArguments)
			const keyType = zodToTsNode(zod._def.keyType, ...otherArguments)

			const node = f.createTypeReferenceNode(
				f.createIdentifier('Map'),
				[
					keyType,
					valueType,
				],
			)

			return node
		}

		case 'ZodSet': {
			// z.set(z.string()) -> Set<string>
			const type = zodToTsNode(zod._def.valueType, ...otherArguments)

			const node = f.createTypeReferenceNode(
				f.createIdentifier('Set'),
				[type],
			)
			return node
		}

		case 'ZodIntersection': {
			// z.number().and(z.string()) -> number & string
			const left = zodToTsNode(zod._def.left, ...otherArguments)
			const right = zodToTsNode(zod._def.right, ...otherArguments)
			const node = f.createIntersectionTypeNode([left, right])
			return node
		}

		case 'ZodPromise': {
			// z.promise(z.string()) -> Promise<string>
			const type = zodToTsNode(zod._def.type, ...otherArguments)

			const node = f.createTypeReferenceNode(
				f.createIdentifier('Promise'),
				[type],
			)

			return node
		}

		case 'ZodFunction': {
			// z.function().args(z.string()).returns(z.number()) -> (args_0: string) => number
			const argumentTypes = zod._def.args._def.items.map((argument: ZodTypeAny, index: number) => {
				const argumentType = zodToTsNode(argument, ...otherArguments)

				return f.createParameterDeclaration(
					undefined,
					undefined,
					f.createIdentifier(`args_${index}`),
					undefined,
					argumentType,
				)
			}) as ts.ParameterDeclaration[]

			argumentTypes.push(
				f.createParameterDeclaration(
					undefined,
					f.createToken(SyntaxKind.DotDotDotToken),
					f.createIdentifier(`args_${argumentTypes.length}`),
					undefined,
					f.createArrayTypeNode(createUnknownKeywordNode()),
				),
			)

			const returnType = zodToTsNode(zod._def.returns, ...otherArguments)

			const node = f.createFunctionTypeNode(
				undefined,
				argumentTypes,
				returnType,
			)

			return node
		}

		case 'ZodDefault': {
			// z.string().optional().default('hi') -> string
			const type = zodToTsNode(zod._def.innerType, ...otherArguments) as ts.TypeNode

			const filteredNodes: ts.Node[] = []

			type.forEachChild((node) => {
				if (!([SyntaxKind.UndefinedKeyword].includes(node.kind))) {
					filteredNodes.push(node)
				}
			})

			// @ts-expect-error needed to set children
			type.types = filteredNodes

			return type
		}
	}

	return f.createKeywordTypeNode(SyntaxKind.AnyKeyword)
}

export { createTypeAlias, printNode, withGetType } from './utils'

export { type GetType, type ZodToTsOptions } from './types'
