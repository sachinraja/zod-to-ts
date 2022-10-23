import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils'

const ShapeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('circle'), radius: z.number() }),
  z.object({ kind: z.literal('square'), x: z.number() }),
  z.object({ kind: z.literal('triangle'), x: z.number(), y: z.number() }),
])

describe('z.discriminatedUnion()', () => {
  const { node } = zodToTs(ShapeSchema, 'Shape')

  it('outputs correct typescript', () => {
    expect(printNodeTest(node)).toMatchInlineSnapshot(`
      "{
          kind: \\"circle\\";
          radius: number;
      } | {
          kind: \\"square\\";
          x: number;
      } | {
          kind: \\"triangle\\";
          x: number;
          y: number;
      }"
    `)
  })
})
