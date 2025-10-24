import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createAuxiliaryTypeStore, zodToTs } from '../src'
import { printNodeTest } from './utils'

const ItemsSchema = z
	.object({
		id: z.number(),
		value: z.string(),
	})
	.array()

describe('z.array()', () => {
	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(ItemsSchema, { auxiliaryTypeStore })

	it('outputs correct typescript', () => {
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    id: number;
			    value: string;
			}[]"
		`)
	})
})
