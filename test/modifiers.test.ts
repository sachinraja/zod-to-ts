import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils'

const OptionalStringSchema = z.string().optional()

describe('z.optional()', () => {
  const { node } = zodToTs(OptionalStringSchema)

  it('outputs correct typescript', () => {
    expect(printNodeTest(node)).toMatchInlineSnapshot('"string | undefined"')
  })
})

const NullableUsernameSchema = z.object({
  username: z.string().nullable(),
})

describe('z.nullable()', () => {
  const { node } = zodToTs(NullableUsernameSchema)

  it('outputs correct typescript', () => {
    expect(printNodeTest(node)).toMatchInlineSnapshot(`
      "{
          username: string | null;
      }"
    `)
  })
})
