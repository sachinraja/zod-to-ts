import ts from 'typescript'
import { ZodTypeAny } from 'zod'
import { example } from './example'
import {
  GetType,
  GetTypeFunction,
  LiteralType,
  RequiredZodToTsOptions,
  ZodToTsOptions,
  ZodToTsReturn,
  ZodToTsStore,
} from './types'
import { createTypeAlias, createTypeReferenceFromString, maybeIdentifierToTypeReference, printNode } from './utils'

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
  const resolved: RequiredZodToTsOptions = { resolveNativeEnums: true }
  return { ...resolved, ...raw }
}

export const zodToTs = (
  zod: ZodTypeAny,
  identifier: string | undefined,
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
  const { typeName } = zod._def

  const zodPrimitive = zodPrimitiveToTs(typeName)
  if (zodPrimitive) return zodPrimitive

  const otherArgs = [identifier, store, options] as const

  switch (typeName) {
    case 'ZodLazy': {
      // it is impossible to determine what the lazy value is referring to
      // so we force the user to declare it
      let type = callGetType(zod, identifier, options)

      if (!type) type = createTypeReferenceFromString(identifier)
      else type = maybeIdentifierToTypeReference(type)

      return type
    }
    case 'ZodLiteral':
      // z.literal('hi') -> 'hi
      return zodLiteralToTs(zod._def.value)
    case 'ZodObject': {
      const properties = Object.entries(zod._def.shape())

      const members: ts.TypeElement[] = properties.map(([key, value]) => {
        const type = zodToTsNode(value as ZodTypeAny, ...otherArgs)

        return ts.factory.createPropertySignature(
          undefined,
          ts.factory.createIdentifier(key),
          undefined,
          type,
        )
      })
      return ts.factory.createTypeLiteralNode(members)
    }

    case 'ZodArray': {
      const type = zodToTsNode(zod._def.type, ...otherArgs)
      const node = ts.factory.createArrayTypeNode(type)
      return node
    }

    case 'ZodEnum': {
      // z.enum['a', 'b', 'c'] -> 'a' | 'b' | 'c
      const types = zod._def.values.map((value: string) => ts.factory.createStringLiteral(value))
      return ts.factory.createUnionTypeNode(types)
    }

    case 'ZodUnion': {
      // z.union([z.string(), z.number()]) -> string | number
      const types = zod._def.options.map((option: ZodTypeAny) => zodToTsNode(option, ...otherArgs))
      return ts.factory.createUnionTypeNode(types)
    }

    case 'ZodEffects': {
      // ignore any effects, they won't factor into the types
      const node = zodToTsNode(zod._def.schema, ...otherArgs) as ts.TypeNode
      return node
    }

    case 'ZodNativeEnum': {
      // z.nativeEnum(Fruits) -> Fruits
      // can resolve Fruits into store and user can handle enums
      let type = callGetType(zod, identifier, options)
      if (!type) return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)

      if (options.resolveNativeEnums) {
        const enumMembers = Object.entries(zod._def.values as Record<string, string>).map(([key, value]) => {
          return ts.factory.createEnumMember(
            ts.factory.createIdentifier(key),
            ts.factory.createStringLiteral(value),
          )
        })

        if (ts.isIdentifier(type)) {
          store.nativeEnums.push(
            ts.factory.createEnumDeclaration(
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
      return ts.factory.createUnionTypeNode([
        innerType,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
      ])
    }

    case 'ZodNullable': {
      const innerType = zodToTsNode(zod._def.innerType, ...otherArgs) as ts.TypeNode
      return ts.factory.createUnionTypeNode([
        innerType,
        // @ts-expect-error this works
        // but 'createKeyWordTypeNode' doesn't accept NullKeyword for some reason
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NullKeyword),
      ])
    }

    case 'ZodTuple': {
      // z.tuple([z.string(), z.number()]) -> [string, number]
      const types = zod._def.items.map((option: ZodTypeAny) => zodToTsNode(option, ...otherArgs))
      return ts.factory.createTupleTypeNode(types)
    }

    case 'ZodRecord': {
      // z.record(z.number()) -> { [x: string]: number }
      const valueType = zodToTsNode(zod._def.valueType, ...otherArgs)

      const node = ts.factory.createTypeLiteralNode([ts.factory.createIndexSignature(
        undefined,
        undefined,
        [ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          undefined,
          ts.factory.createIdentifier('x'),
          undefined,
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
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

      const node = ts.factory.createTypeReferenceNode(
        ts.factory.createIdentifier('Map'),
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

      const node = ts.factory.createTypeReferenceNode(
        ts.factory.createIdentifier('Set'),
        [type],
      )
      return node
    }

    case 'ZodIntersection': {
      // z.number().and(z.string()) -> number & string
      const left = zodToTsNode(zod._def.left, ...otherArgs)
      const right = zodToTsNode(zod._def.right, ...otherArgs)
      const node = ts.factory.createIntersectionTypeNode([left, right])
      return node
    }

    case 'ZodPromise': {
      // z.promise(z.string()) -> Promise<string>
      const type = zodToTsNode(zod._def.type, ...otherArgs)

      const node = ts.factory.createTypeReferenceNode(
        ts.factory.createIdentifier('Promise'),
        [type],
      )

      return node
    }

    case 'ZodFunction': {
      // z.function().args(z.string()).returns(z.number()) -> (args_0: string) => number
      const argTypes = zod._def.args._def.items.map((arg: ZodTypeAny, index: number) => {
        const argType = zodToTsNode(arg, ...otherArgs)

        return ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          undefined,
          ts.factory.createIdentifier(`args_${index}`),
          undefined,
          argType,
          undefined,
        )
      }) as ts.ParameterDeclaration[]

      argTypes.push(
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          ts.factory.createToken(ts.SyntaxKind.DotDotDotToken),
          ts.factory.createIdentifier(`args_${argTypes.length}`),
          undefined,
          ts.factory.createArrayTypeNode(ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)),
          undefined,
        ),
      )

      const returnType = zodToTsNode(zod._def.returns, ...otherArgs)

      const node = ts.factory.createFunctionTypeNode(
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

  return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
}

const zodPrimitiveToTs = (zodPrimitive: string) => {
  let node: ts.TypeNode | null = null
  switch (zodPrimitive) {
    case 'ZodString':
      node = ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
      break
    case 'ZodNumber':
      node = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
      break
    case 'ZodBigInt':
      node = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword)
      break
    case 'ZodBoolean':
      node = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
      break
    case 'ZodDate':
      node = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('Date'))
      break
    case 'ZodUndefined':
      node = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
      break
    case 'ZodNull':
      // @ts-expect-error this works
      // but 'createKeyWordTypeNode' doesn't accept NullKeyword for some reason
      node = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NullKeyword)
      break
    case 'ZodVoid':
      node = ts.factory.createUnionTypeNode([
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
      ])
      break
    case 'ZodAny':
      node = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
      break
    case 'ZodUnknown':
      node = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
      break
    case 'ZodNever':
      node = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword)
  }

  return node
}

const zodLiteralToTs = (value: LiteralType) => {
  let literal: ts.LiteralExpression | ts.BooleanLiteral

  switch (typeof value) {
    case 'number':
      literal = ts.factory.createNumericLiteral(value)
      break
    case 'boolean':
      if (value === true) literal = ts.factory.createTrue()
      else literal = ts.factory.createFalse()
      break
    default:
      literal = ts.factory.createStringLiteral(value)
      break
  }

  return ts.factory.createLiteralTypeNode(literal)
}

const { node, store } = zodToTs(example, undefined, { resolveNativeEnums: true })
const printedNode = printNode(node)
// console.log(printedNode)
// console.log(store.nativeEnums)
console.log(printNode(createTypeAlias('Identifier', node)))

export { createTypeAlias, printNode }
export type { GetType, ZodToTsOptions }
