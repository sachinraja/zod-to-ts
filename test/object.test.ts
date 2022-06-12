/* eslint-disable no-useless-escape */
import { expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils'

it('supports string literal properties', () => {
  const schema = z.object({
    'string-literal': z.string(),
    5: z.number(),
  })

  const { node } = zodToTs(schema)

  expect(printNodeTest(node)).toMatchInlineSnapshot(`
    "{
        \\"5\\": number;
        \\"string-literal\\": string;
    }"
  `)
})

it('does not unnecessary quote identifiers', () => {
  const schema = z.object({
    id: z.string(),
    name: z.string(),
    countryOfOrigin: z.string(),
  })

  const { node } = zodToTs(schema)

  expect(printNodeTest(node)).toMatchInlineSnapshot(`
    "{
        id: string;
        name: string;
        countryOfOrigin: string;
    }"
  `)
})

it('escapes correctly', () => {
  const schema = z.object({
    '\\': z.string(),
    '"': z.string(),
    "'": z.string(),
    '`': z.string(),
    '\n': z.number(),
    '$e': z.any(),
    '4t': z.any(),
    '_r': z.any(),
    '-r': z.undefined(),
  })

  const { node } = zodToTs(schema)

  expect(printNodeTest(node)).toMatchInlineSnapshot(`
    "{
        \\"\\\\\\\\\\": string;
        \\"\\\\\\"\\": string;
        \\"'\\": string;
        \\"\`\\": string;
        \\"\\\\n\\": number;
        \$e?: any;
        \\"4t\\"?: any;
        _r?: any;
        \\"-r\\"?: undefined;
    }"
  `)
})

it('supports zod.describe()', () => {
  const schema = z.object({
    name: z.string().describe('The name of the item'),
    price: z.number().describe('The price of the item'),
  })

  const { node } = zodToTs(schema)

  expect(printNodeTest(node)).toMatchInlineSnapshot(`
    "{
        /** The name of the item */
        name: string;
        /** The price of the item */
        price: number;
    }"
  `)
})
