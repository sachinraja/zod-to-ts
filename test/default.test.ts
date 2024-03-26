import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils'

const Schema1 = z.object({
	foo: z.enum(['a', 'b', 'c']).default('a'),
})
const Schema2 = z.object({
	foo: z.string().default('b').describe('Description'),
})

describe('z.default()', () => {
	it('outputs correct jsdoc for just a default value', () => {
		const { node } = zodToTs(Schema1, 'Schema1')
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    /** @default \\"a\\" */
			    foo?: \\"a\\" | \\"b\\" | \\"c\\";
			}"
		`)
	})

	it('outputs correct jsdoc for node with both default and description', () => {
		const { node } = zodToTs(Schema2, 'Schema2')
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    /** Description
			     * @default \\"b\\"
			     */
			    foo?: string;
			}"
		`)
	})
})
