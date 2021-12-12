import ts from 'typescript'
import { ZodTypeAny } from 'zod'
import { example } from './example'
import { GetType, GetTypeFunction, LiteralType } from './types'

const callGetType = (zod: ZodTypeAny & GetType, identifier: string): ts.TypeNode | null => {
  let type: ts.TypeNode | null = null

  // this must be called before accessing 'type'
  if (zod.getType) type = zod.getType(ts, identifier)
  return type
}

export const zodToTs = (zod: ZodTypeAny, identifier: string | undefined = 'Lazy') => {
  const { typeName } = zod._def

  const zodPrimitive = zodPrimitiveToTs(typeName)
  if (zodPrimitive) return zodPrimitive

  switch (typeName) {
    case 'ZodLazy': {
      // this is a hack
      // it is impossible to determine what the lazy value is referring to
      // so we force the user to declare it
      let type = callGetType(zod, identifier)

      if (!type) type = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(identifier))

      return type
    }
    case 'ZodLiteral':
      // z.literal('hi') -> 'hi
      return zodLiteralToTs(zod._def.value)
    case 'ZodObject': {
      const properties = Object.entries(zod._def.shape())

      const members: ts.TypeElement[] = properties.map(([key, value]) => {
        const type = zodToTs(value as ZodTypeAny, identifier)

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
      const type = zodToTs(zod._def.type, identifier)
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
      const types = zod._def.options.map((option: ZodTypeAny) => zodToTs(option, identifier))
      return ts.factory.createUnionTypeNode(types)
    }

    case 'ZodEffects': {
      // ignore any effects, they won't factor into the types
      const node = zodToTs(zod._def.schema, identifier) as ts.TypeNode
      return node
    }

    case 'ZodNativeEnum': {
      let type = callGetType(zod, identifier)

      if (!type) type = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)

      return type
    }

    case 'ZodOptional': {
      const innerType = zodToTs(zod._def.innerType, identifier) as ts.TypeNode
      return ts.factory.createUnionTypeNode([
        innerType,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
      ])
    }

    case 'ZodNullable': {
      const innerType = zodToTs(zod._def.innerType, identifier) as ts.TypeNode
      return ts.factory.createUnionTypeNode([
        innerType,
        // @ts-expect-error this works
        // but 'createKeyWordTypeNode' doesn't accept NullKeyword for some reason
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NullKeyword),
      ])
    }

    case 'ZodTuple': {
      // z.tuple([z.string(), z.number()]) -> [string, number]
      const types = zod._def.items.map((option: ZodTypeAny) => zodToTs(option, identifier))
      return ts.factory.createTupleTypeNode(types)
    }

    case 'ZodRecord': {
      // z.record(z.number()) -> { [x: string]: number }
      const valueType = zodToTs(zod._def.valueType, identifier)

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
      const valueType = zodToTs(zod._def.valueType, identifier)
      const keyType = zodToTs(zod._def.keyType, identifier)

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
      const type = zodToTs(zod._def.valueType, identifier)

      const node = ts.factory.createTypeReferenceNode(
        ts.factory.createIdentifier('Set'),
        [type],
      )
      return node
    }

    case 'ZodIntersection': {
      // z.number().and(z.string()) -> number & string
      const left = zodToTs(zod._def.left, identifier)
      const right = zodToTs(zod._def.right, identifier)
      const node = ts.factory.createIntersectionTypeNode([left, right])
      return node
    }

    case 'ZodPromise': {
      // z.promise(z.string()) -> Promise<string>
      const type = zodToTs(zod._def.type, identifier)

      const node = ts.factory.createTypeReferenceNode(
        ts.factory.createIdentifier('Promise'),
        [type],
      )

      return node
    }

    case 'ZodFunction': {
      // z.function().args(z.string()).returns(z.number()) -> (args_0: string) => number
      const argTypes = zod._def.args._def.items.map((arg: ZodTypeAny, index: number) => {
        const argType = zodToTs(arg, identifier)

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

      const returnType = zodToTs(zod._def.returns, identifier)

      const node = ts.factory.createFunctionTypeNode(
        undefined,
        argTypes,
        returnType,
      )

      return node
    }

    case 'ZodDefault': {
      // z.string().optional().default('hi') -> string
      const type = zodToTs(zod._def.innerType, identifier) as ts.TypeNode

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
      node = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('Date'), undefined)
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

const getSourceFile = (code: string) =>
  ts.createSourceFile('print.ts', code, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)

const printNode = (node: ts.Node) => {
  const sourceFile = getSourceFile('')
  const printer = ts.createPrinter()
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
}

const printedNode = printNode(zodToTs(example, 'hello'))
console.log(printedNode)
