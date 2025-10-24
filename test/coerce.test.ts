import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'
import { createAuxiliaryTypeStore, zodToTs } from '../src'
import { printNodeTest } from './utils'

describe('z.coerce()', () => {
	it('supports z.coerce.string()', () => {
		const schema = z.coerce.string()

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`"string"`)
	})

	it('supports z.coerce.number()', () => {
		const schema = z.coerce.number()

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`"number"`)
	})

	it('supports z.coerce.date()', () => {
		const schema = z.coerce.date()

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`"Date"`)
	})

	it('supports z.coerce.boolean()', () => {
		const schema = z.coerce.boolean()

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`"boolean"`)
	})

	it('supports z.coerce.bigint()', () => {
		const schema = z.coerce.bigint()

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`"bigint"`)
	})
})
