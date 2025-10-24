import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'
import { createAuxiliaryTypeStore, zodToTs } from '../src'
import { printNodeTest } from './utils'

describe('z.readonly()', () => {
	it('supports readonly object', () => {
		const keySchema = z.set(z.string()).optional().readonly()

		const schema = z
			.object({
				key: keySchema.describe('Comment for key'),
			})
			.readonly()

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    /** Comment for key */
			    readonly key?: Set<string> | undefined;
			}"
		`)
	})

	it('supports readonly set', () => {
		const keySchema = z.set(z.string()).readonly()

		const schema = z.object({
			key: keySchema.describe('Comment for key'),
		})

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    /** Comment for key */
			    key: ReadonlySet<string>;
			}"
		`)
	})

	it('supports readonly map', () => {
		const keySchema = z.map(z.string(), z.string()).readonly()

		const schema = z.object({
			key: keySchema.describe('Comment for key'),
		})

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    /** Comment for key */
			    key: ReadonlyMap<string, string>;
			}"
		`)
	})

	it('supports readonly array', () => {
		const keySchema = z.array(z.string()).readonly()

		const schema = z.object({
			key: keySchema.describe('Comment for key'),
		})

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    /** Comment for key */
			    key: readonly string[];
			}"
		`)
	})

	it('supports readonly tuple', () => {
		const keySchema = z.tuple([z.string(), z.number()]).readonly()

		const schema = z.object({
			key: keySchema.describe('Comment for key'),
		})

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    /** Comment for key */
			    key: readonly [
			        string,
			        number
			    ];
			}"
		`)
	})
})
