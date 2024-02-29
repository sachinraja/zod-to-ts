import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils'

const ItemsSchema = z.object({
	id: z.number(),
	value: z.string(),
}).array()

describe('z.array()', () => {
	const { node } = zodToTs(ItemsSchema, 'User')

	it('outputs correct typescript', () => {
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    id: number;
			    value: string;
			}[]"
		`)
	})

	const { node: readonlyNode } = zodToTs(ItemsSchema, 'User', { readonlyArrays: true })

	it('readonlyArrays option outputs correct typescript', () => {
		expect(printNodeTest(readonlyNode)).toMatchInlineSnapshot(`
			"readonly {
			    id: number;
			    value: string;
			}[]"
		`)
	})
})
