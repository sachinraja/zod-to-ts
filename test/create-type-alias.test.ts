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

  it('outputs correct typescript', () => {
    expect(printNodeTest(typeAlias)).toMatchInlineSnapshot(`
      "type User = {
          username: string;
          age: number;
      };"
    `)
  })
})
