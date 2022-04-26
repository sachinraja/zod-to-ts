import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils'

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

  it('outputs correct typescript', () => {
    expect(printNodeTest(node)).toMatchInlineSnapshot(`
      "{
          username: string;
          friends: User[];
      }"
    `)
  })

  it('uses `Identifier` when no identifier is passed', () => {
    const { node: nodeWithoutSpecifiedIdentifier } = zodToTs(UserSchema)

    expect(printNodeTest(nodeWithoutSpecifiedIdentifier)).toMatchInlineSnapshot(`
      "{
          username: string;
          friends: Identifier[];
      }"
    `)
  })
})
