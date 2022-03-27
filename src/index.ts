import ts from 'typescript'
import { ZodTypeAny } from 'zod'
import {
  GetType,
  GetTypeFunction,
  LiteralType,
  RequiredZodToTsOptions,
  ZodToTsNodeParams,
  ZodToTsOptions,
  ZodToTsReturn,
  ZodToTsStore,
} from './types'
import {
  createTypeAlias,
  createTypeReferenceFromString,
  createUnknownKeywordNode,
  maybeIdentifierToTypeReference,
  printNode,
} from './utils'

const { factory: f } = ts

const callGetType = (
  zod: ZodTypeAny & GetType,
  identifier: string,
  options: RequiredZodToTsOptions,
) => {
  let type: ReturnType<GetTypeFunction> | null = null

  // this must be called before accessing 'type'
  if (zod.getType) type = zod.getType(ts, identifier, options)
  return type
}

export const resolveOptions = (raw?: ZodToTsOptions): RequiredZodToTsOptions => {
  const resolved: RequiredZodToTsOptions = { resolveNativeEnums: true, treatOptionalsAs: 'undefined' }
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
  params?: ZodToTsNodeParams,
) => {
  const { typeName } = zod._def

  const getTypeType = callGetType(zod, identifier, options)
  // special case native enum, which needs an identifier node
  if (getTypeType && typeName !== 'ZodNativeEnum') {
    return maybeIdentifierToTypeReference(getTypeType)
  }

  const zodPrimitive = zodPrimitiveToTs(typeName)
  if (zodPrimitive) return zodPrimitive

  const otherArgs = [identifier, store, options] as const

  switch (typeName) {
    case 'ZodLazy': {
      // it is impossible to determine what the lazy value is referring to
      // so we force the user to declare it
      if (!getTypeType) return createTypeReferenceFromString(identifier)
      break
    }
    case 'ZodLiteral':
      // z.literal('hi') -> 'hi'
      return zodLiteralToTs(zod._def.value)
    case 'ZodObject': {
      const properties = Object.entries(zod._def.shape())

      const members: ts.TypeElement[] = properties.map(([key, value]) => {
        const zodAny = value as ZodTypeAny
        const type = zodToTsNode(zodAny, ...otherArgs, { parentIsObject: true })

        const flagsRequireOptional = options.treatOptionalsAs === 'both' || options.treatOptionalsAs === 'optional'
        return f.createPropertySignature(
          undefined,
          f.createIdentifier(key),
          zodAny._def.typeName === 'ZodOptional' && flagsRequireOptional
            ? f.createToken(ts.SyntaxKind.QuestionToken)
            : undefined,
          type,
        )
      })
      return f.createTypeLiteralNode(members)
    }

    case 'ZodArray': {
      const type = zodToTsNode(zod._def.type, ...otherArgs)
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
      const types = zod._def.options.map((option: ZodTypeAny) => zodToTsNode(option, ...otherArgs))
      return f.createUnionTypeNode(types)
    }

    case 'ZodEffects': {
      // ignore any effects, they won't factor into the types
      const node = zodToTsNode(zod._def.schema, ...otherArgs) as ts.TypeNode
      return node
    }

    case 'ZodNativeEnum': {
      // z.nativeEnum(Fruits) -> Fruits
      // can resolve Fruits into store and user can handle enums
      let type = getTypeType
      if (!type) return createUnknownKeywordNode()

      if (options.resolveNativeEnums) {
        const enumMembers = Object.entries(zod._def.values as Record<string, string>).map(([key, value]) => {
          return f.createEnumMember(
            f.createIdentifier(key),
            f.createStringLiteral(value),
          )
        })

        if (ts.isIdentifier(type)) {
          store.nativeEnums.push(
            f.createEnumDeclaration(
              undefined,
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
      const innerType = zodToTsNode(zod._def.innerType, ...otherArgs) as ts.TypeNode
      if (params?.parentIsObject && options.treatOptionalsAs === 'optional') {
        return innerType
      }
      return f.createUnionTypeNode([
        innerType,
        f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
      ])
    }

    case 'ZodNullable': {
      const innerType = zodToTsNode(zod._def.innerType, ...otherArgs) as ts.TypeNode
      return f.createUnionTypeNode([
        innerType,
        f.createLiteralTypeNode(f.createNull()),
      ])
    }

    case 'ZodTuple': {
      // z.tuple([z.string(), z.number()]) -> [string, number]
      const types = zod._def.items.map((option: ZodTypeAny) => zodToTsNode(option, ...otherArgs))
      return f.createTupleTypeNode(types)
    }

    case 'ZodRecord': {
      // z.record(z.number()) -> { [x: string]: number }
      const valueType = zodToTsNode(zod._def.valueType, ...otherArgs)

      const node = f.createTypeLiteralNode([f.createIndexSignature(
        undefined,
        undefined,
        [f.createParameterDeclaration(
          undefined,
          undefined,
          undefined,
          f.createIdentifier('x'),
          undefined,
          f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          undefined,
        )],
        valueType,
      )])

      return node
    }

    case 'ZodMap': {
      // z.map(z.string()) -> Map<string>
      const valueType = zodToTsNode(zod._def.valueType, ...otherArgs)
      const keyType = zodToTsNode(zod._def.keyType, ...otherArgs)

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
      const type = zodToTsNode(zod._def.valueType, ...otherArgs)

      const node = f.createTypeReferenceNode(
        f.createIdentifier('Set'),
        [type],
      )
      return node
    }

    case 'ZodIntersection': {
      // z.number().and(z.string()) -> number & string
      const left = zodToTsNode(zod._def.left, ...otherArgs)
      const right = zodToTsNode(zod._def.right, ...otherArgs)
      const node = f.createIntersectionTypeNode([left, right])
      return node
    }

    case 'ZodPromise': {
      // z.promise(z.string()) -> Promise<string>
      const type = zodToTsNode(zod._def.type, ...otherArgs)

      const node = f.createTypeReferenceNode(
        f.createIdentifier('Promise'),
        [type],
      )

      return node
    }

    case 'ZodFunction': {
      // z.function().args(z.string()).returns(z.number()) -> (args_0: string) => number
      const argTypes = zod._def.args._def.items.map((arg: ZodTypeAny, index: number) => {
        const argType = zodToTsNode(arg, ...otherArgs)

        return f.createParameterDeclaration(
          undefined,
          undefined,
          undefined,
          f.createIdentifier(`args_${index}`),
          undefined,
          argType,
          undefined,
        )
      }) as ts.ParameterDeclaration[]

      argTypes.push(
        f.createParameterDeclaration(
          undefined,
          undefined,
          f.createToken(ts.SyntaxKind.DotDotDotToken),
          f.createIdentifier(`args_${argTypes.length}`),
          undefined,
          f.createArrayTypeNode(createUnknownKeywordNode()),
          undefined,
        ),
      )

      const returnType = zodToTsNode(zod._def.returns, ...otherArgs)

      const node = f.createFunctionTypeNode(
        undefined,
        argTypes,
        returnType,
      )

      return node
    }

    case 'ZodDefault': {
      // z.string().optional().default('hi') -> string
      const type = zodToTsNode(zod._def.innerType, ...otherArgs) as ts.TypeNode

      const filteredNodes: ts.Node[] = []

      type.forEachChild((node) => {
        if (!([ts.SyntaxKind.UndefinedKeyword].includes(node.kind))) {
          filteredNodes.push(node)
        }
      })

      // @ts-expect-error needed to set children
      type.types = filteredNodes

      return type
    }
  }
  return f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
}

const zodPrimitiveToTs = (zodPrimitive: string) => {
  let node: ts.TypeNode | null = null
  switch (zodPrimitive) {
    case 'ZodString':
      node = f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
      break
    case 'ZodNumber':
      node = f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
      break
    case 'ZodBigInt':
      node = f.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword)
      break
    case 'ZodBoolean':
      node = f.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
      break
    case 'ZodDate':
      node = f.createTypeReferenceNode(f.createIdentifier('Date'))
      break
    case 'ZodUndefined':
      node = f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
      break
    case 'ZodNull':
      node = f.createLiteralTypeNode(f.createNull())
      break
    case 'ZodVoid':
      node = f.createUnionTypeNode([
        f.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
        f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
      ])
      break
    case 'ZodAny':
      node = f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
      break
    case 'ZodUnknown':
      node = createUnknownKeywordNode()
      break
    case 'ZodNever':
      node = f.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword)
  }

  return node
}

const zodLiteralToTs = (value: LiteralType) => {
  let literal: ts.LiteralExpression | ts.BooleanLiteral

  switch (typeof value) {
    case 'number':
      literal = f.createNumericLiteral(value)
      break
    case 'boolean':
      if (value === true) literal = f.createTrue()
      else literal = f.createFalse()
      break
    default:
      literal = f.createStringLiteral(value)
      break
  }

  return f.createLiteralTypeNode(literal)
}

export { createTypeAlias, printNode }
export { withGetType } from './utils'
export type { GetType, ZodToTsOptions }
