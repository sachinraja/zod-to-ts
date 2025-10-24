import { describe, expect, it } from 'vitest'
import z from 'zod'
import { createAuxiliaryTypeStore, zodToTs } from '../src'
import { printNodeTest } from './utils'

describe('z.pipe()', () => {
	it('supports z.pipe() output', () => {
		const schema = z.pipe(z.string(), z.coerce.number())

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`"number"`)
	})

	it('supports z.pipe() input', () => {
		const schema = z.pipe(z.string(), z.coerce.number())

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore, io: 'input' })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`"string"`)
	})
})
