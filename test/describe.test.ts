import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'
import { createAuxiliaryTypeStore, zodToTs } from '../src'
import { printNodeTest } from './utils'

describe('z.describe()', () => {
	it('supports describing schema', () => {
		const keySchema = z.string()

		const schema = z.object({
			key: keySchema.describe('Comment for key'),
		})

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    /** Comment for key */
			    key: string;
			}"
		`)
	})
})
