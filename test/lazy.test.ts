import { dedent } from 'ts-dedent'
import ts from 'typescript'
import { z } from 'zod'
import { printNode, zodToTs } from '../src'

type User = {
  username: string
  friends: User[]
}

const UserSchema: z.ZodSchema<User> = z.object({
  username: z.string(),
  friends: z.lazy(() => UserSchema).array(),
})

describe('z.lazy() referencing root type', () => {
  const { node } = zodToTs(UserSchema, 'User')

  it('has correct node structure', () => {
    const expectedNode = ts.factory.createTypeLiteralNode(
      [
        ts.factory.createPropertySignature(
          undefined,
          ts.factory.createIdentifier('username'),
          undefined,
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ),
        ts.factory.createPropertySignature(
          undefined,
          ts.factory.createIdentifier('friends'),
          undefined,
          ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode(
            ts.factory.createIdentifier('User'),
            undefined,
          )),
        ),
      ],
    )

    expect(node).toStrictEqual(expectedNode)
  })

  it('outputs correct typescript', () => {
    const expectedType = dedent(`
    {
        username: string;
        friends: User[];
    }`)

    const printedNode = printNode(node)

    expect(printedNode).toStrictEqual(expectedType)
  })

  it('uses `Identifier` when no identifier is passed', () => {
    const { node: nodeWithoutSpecifiedIdentifier } = zodToTs(UserSchema)

    const expectedType = dedent(`
    {
        username: string;
        friends: Identifier[];
    }`)

    const printedNode = printNode(nodeWithoutSpecifiedIdentifier)

    expect(printedNode).toStrictEqual(expectedType)
  })
})
