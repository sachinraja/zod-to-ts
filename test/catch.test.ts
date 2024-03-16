import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils'

const ListSchema = z.object({
  // eslint-disable-next-line unicorn/prefer-top-level-await
	items: z.enum(['a', 'b', 'c']).catch("a") 
}).array()

describe('z.catch()', () => {
	const { node } = zodToTs(ListSchema, 'List')

	it('outputs correct typescript', () => {
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    items: \\"a\\" | \\"b\\" | \\"c\\";
			}[]"
		`)
	})
})
