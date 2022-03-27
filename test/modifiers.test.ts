import { dedent } from 'ts-dedent'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils'

const OptionalStringSchema = z.string().optional()

describe('z.optional()', () => {
  const { node } = zodToTs(OptionalStringSchema)

  it('has correct node structure', () => {
    const expectedNode = ts.factory.createUnionTypeNode([
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
    ])

    expect(node).to.deep.equal(expectedNode)
  })

  it('outputs correct typescript', () => {
    const expectedType = 'string | undefined'
    const printedNode = printNodeTest(node)
    expect(printedNode).to.deep.equal(expectedType)
  })
})

describe('z.optional()', () => {
  const { node } = zodToTs(OptionalStringSchema)

  it('has correct node structure', () => {
    const expectedNode = ts.factory.createUnionTypeNode([
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
    ])

    expect(node).to.deep.equal(expectedNode)
  })

  it('outputs correct typescript', () => {
    const expectedType = 'string | undefined'
    const printedNode = printNodeTest(node)
    expect(printedNode).toStrictEqual(expectedType)
  })
})

const ObjectWithOptionals = z.object({
  optional: OptionalStringSchema,
  required: z.string(),
  tuple: z.tuple([
    z.string().optional(),
    z.number(),
    z.object({
      optional: z.string().optional(),
      required: z.string(),
    }),
  ]).optional(),
})

describe('z.optional() - treatOptionalsAs flag', () => {
  it('has only undefined but not optional', () => {
    const { node: nodeFlagDefault } = zodToTs(ObjectWithOptionals, undefined)
    const { node: nodeFlagFalse } = zodToTs(ObjectWithOptionals, undefined, {
      treatOptionalsAs: 'undefined',
    })

    const expectedType = dedent `{
        optional: string | undefined;
        required: string;
        tuple: [
            string | undefined,
            number,
            {
                optional: string | undefined;
                required: string;
            }
        ] | undefined;
    }`

    expect(printNodeTest(nodeFlagDefault)).toStrictEqual(expectedType)
    expect(printNodeTest(nodeFlagFalse)).toStrictEqual(expectedType)
  })

  it('has optional but not undefined', () => {
    const { node } = zodToTs(ObjectWithOptionals, undefined, { treatOptionalsAs: 'optional' })

    const expectedType = dedent `{
        optional?: string;
        required: string;
        tuple?: [
            string | undefined,
            number,
            {
                optional?: string;
                required: string;
            }
        ];
    }`

    const printedNode = printNodeTest(node)
    expect(printedNode).toStrictEqual(expectedType)
  })

  it('has optional and undefined', () => {
    const { node } = zodToTs(ObjectWithOptionals, undefined, {
      treatOptionalsAs: 'both',
    })

    const expectedType = dedent `{
        optional?: string | undefined;
        required: string;
        tuple?: [
            string | undefined,
            number,
            {
                optional?: string | undefined;
                required: string;
            }
        ] | undefined;
    }`

    expect(printNodeTest(node)).toStrictEqual(expectedType)
  })
})

const NullableUsernameSchema = z.object({
  username: z.string().nullable(),
})

describe('z.nullable()', () => {
  const { node } = zodToTs(NullableUsernameSchema)

  it('has correct node structure', () => {
    const expectedNode = ts.factory.createTypeLiteralNode(
      [
        ts.factory.createPropertySignature(
          undefined,
          ts.factory.createIdentifier('username'),
          undefined,
          ts.factory.createUnionTypeNode([
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            ts.factory.createLiteralTypeNode(ts.factory.createNull()),
          ]),
        ),
      ],
    )

    expect(node).to.deep.equal(expectedNode)
  })

  it('outputs correct typescript', () => {
    const expectedType = dedent `
    {
        username: string | null;
    }`

    const printedNode = printNodeTest(node)

    expect(printedNode).toStrictEqual(expectedType)
  })
})
