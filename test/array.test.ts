import { dedent } from 'ts-dedent'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils.js'

const ItemsSchema = z.object({
  id: z.number(),
  value: z.string(),
}).array()

describe('z.array()', () => {
  const { node } = zodToTs(ItemsSchema, 'User')
  it('has correct node structure', () => {
    const expectedNode = ts.factory.createArrayTypeNode(
      ts.factory.createTypeLiteralNode([
        ts.factory.createPropertySignature(
          undefined,
          ts.factory.createIdentifier('id'),
          undefined,
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
        ),
        ts.factory.createPropertySignature(
          undefined,
          ts.factory.createIdentifier('value'),
          undefined,
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ),
      ]),
    )

    expect(node).to.deep.equal(expectedNode)
  })

  it('outputs correct typescript', () => {
    const expectedType = dedent(`
    {
        id: number;
        value: string;
    }[]`)

    const printedNode = printNodeTest(node)

    expect(printedNode).toStrictEqual(expectedType)
  })
})
