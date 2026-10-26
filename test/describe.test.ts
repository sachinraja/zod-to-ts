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

describe('z.describe().optional()', () => {
	it('supports describing optional schema', () => {
		const keySchema = z.string()

		const schema = z.object({
			key: keySchema.describe('Comment for key').optional(),
		})

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    /** Comment for key */
			    key?: string | undefined;
			}"
		`)
	})
})

describe('z.describe() on nested and readonly members', () => {
	it('keeps comments on nested and readonly members', () => {
		const schema = z.object({
			outer: z
				.object({ inner: z.string().describe('Comment for inner') })
				.describe('Comment for outer'),
			readonlyObject: z
				.object({ key: z.number().describe('Comment for key') })
				.readonly(),
		})

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    /** Comment for outer */
			    outer: {
			        /** Comment for inner */
			        inner: string;
			    };
			    readonlyObject: {
			        /** Comment for key */
			        readonly key: number;
			    };
			}"
		`)
	})
})

describe('z.describe() with multiple lines', () => {
	it('indents continuation lines like the member', () => {
		const schema = z.object({
			outer: z.object({
				key: z.string().describe('First line\n\nSecond line'),
			}),
		})

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    outer: {
			        /** First line
			        
			        Second line */
			        key: string;
			    };
			}"
		`)
	})
})
