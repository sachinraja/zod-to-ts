import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils'

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

  it('outputs correct typescript', () => {
    expect(printNodeTest(node)).toMatchInlineSnapshot()
  })
})
