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
