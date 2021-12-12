import { dedent } from 'ts-dedent'
import ts from 'typescript'
import { z } from 'zod'
import { printNode, zodToTs } from '../src'

const PrimitiveSchema = z.object({
  username: z.string(),
  age: z.number(),
  isAdmin: z.boolean(),
  createdAt: z.date(),
  undef: z.undefined(),
  nu: z.null(),
  vo: z.void(),
  an: z.any(),
  unknow: z.unknown(),
  nev: z.never(),
})

describe('PrimitiveSchema', () => {
  const { node } = zodToTs(PrimitiveSchema, 'User')

  it('has correct node structure', () => {
    const expectedNode = ts.factory.createTypeLiteralNode([
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createIdentifier('username'),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      ),
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createIdentifier('age'),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
      ),
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createIdentifier('isAdmin'),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
      ),
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createIdentifier('createdAt'),
        undefined,
        ts.factory.createTypeReferenceNode(
          ts.factory.createIdentifier('Date'),
          undefined,
        ),
      ),
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createIdentifier('undef'),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
      ),
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createIdentifier('nu'),
        undefined,
        ts.factory.createLiteralTypeNode(ts.factory.createNull()),
      ),
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createIdentifier('vo'),
        undefined,
        ts.factory.createUnionTypeNode([
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
        ]),
      ),
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createIdentifier('an'),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
      ),
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createIdentifier('unknow'),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
      ),
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createIdentifier('nev'),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword),
      ),
    ])

    // hi
    expect(node).toStrictEqual(expectedNode)
  })

  it('outputs correct typescript', () => {
    const expectedType = dedent(`
    {
        username: string;
        age: number;
        isAdmin: boolean;
        createdAt: Date;
        undef: undefined;
        nu: null;
        vo: void | undefined;
        an: any;
        unknow: unknown;
        nev: never;
    }`)

    const printedNode = printNode(node)

    expect(printedNode).toStrictEqual(expectedType)
  })
})
