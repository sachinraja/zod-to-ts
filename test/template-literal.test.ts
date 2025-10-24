import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createAuxiliaryTypeStore, zodToTs } from '../src'
import { printNodeTest } from './utils'

describe('z.templateLiteral()', () => {
	it('outputs correct typescript with basic template literal', () => {
		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const schema = z.templateLiteral(['user_', z.string()])
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`"\`user_\${string}\`"`)
	})

	it('outputs correct typescript with complex template literal', () => {
		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const schema = z.templateLiteral([
			'order_',
			z.number(),
			'_item_',
			z.union([z.string(), z.number()]),
		])
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(
			`"\`order_\${number}_item_\${string | number}\`"`,
		)
	})

	it('outputs correct typescript with nested template literal', () => {
		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const innerTemplate = z.templateLiteral(['item_', z.string()])
		const schema = z.templateLiteral(['order_', z.number(), '_', innerTemplate])
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(
			`"\`order_\${number}_\${\`item_\${string}\`}\`"`,
		)
	})
})
