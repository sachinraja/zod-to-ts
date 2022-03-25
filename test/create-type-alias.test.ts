import { dedent } from 'ts-dedent'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createTypeAlias, zodToTs } from '../src'
import { printNodeTest } from './utils'

const UserSchema = z.object({
  username: z.string(),
  age: z.number(),
})

const identifier = 'User'

describe('type alias', () => {
  const { node } = zodToTs(UserSchema, identifier)
  const typeAlias = createTypeAlias(node, identifier)

  it('has correct node structure', () => {
    const expectedNode = ts.factory.createTypeAliasDeclaration(
      undefined,
      undefined,
      ts.factory.createIdentifier('User'),
      undefined,
      ts.factory.createTypeLiteralNode(
        [
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
        ],
      ),
    )

    expect(typeAlias).to.deep.equal(expectedNode)
  })

  it('outputs correct typescript', () => {
    const expectedType = dedent(`
      type User = {
          username: string;
          age: number;
      };`)

    const printedNode = printNodeTest(typeAlias)

    expect(printedNode).toStrictEqual(expectedType)
  })
})
