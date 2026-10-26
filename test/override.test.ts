import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'
import { createAuxiliaryTypeStore, type TypeOverrideMap, zodToTs } from '../src'
import { printNodeTest } from './utils'

describe('overrides option', () => {
	it('overrides default conversion', () => {
		const overrideMe = z.string()
		const schema = z.object({ override: overrideMe, dontOverride: z.string() })
		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const overrides: TypeOverrideMap = new Map([
			[
				overrideMe,
				(ts) =>
					ts.factory.createTypeReferenceNode(
						ts.factory.createIdentifier('Overridden'),
					),
			],
		])

		const { node } = zodToTs(schema, { auxiliaryTypeStore, overrides })
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    override: Overridden;
			    dontOverride: string;
			}"
		`)
	})

	it('overrides overrideFunction', () => {
		const overrideMe = z.string()
		const schema = z.object({ override: overrideMe, dontOverride: z.string() })
		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const overrides: TypeOverrideMap = new Map([
			[
				overrideMe,
				(ts) =>
					ts.factory.createTypeReferenceNode(
						ts.factory.createIdentifier('OverriddenByMap'),
					),
			],
		])

		const { node } = zodToTs(schema, {
			auxiliaryTypeStore,
			overrides,
			overrideFunction: (schema, ts) => {
				if (schema === overrideMe) {
					return ts.factory.createTypeReferenceNode(
						ts.factory.createIdentifier('OverriddenByFunction'),
					)
				} else {
					return undefined
				}
			},
		})
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    override: OverriddenByMap;
			    dontOverride: string;
			}"
		`)
	})
})

it('overrideFunction option', () => {
	const overrideMe = z.string()
	const schema = z.object({ override: overrideMe, dontOverride: z.string() })
	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(schema, {
		auxiliaryTypeStore,
		overrideFunction: (schema, ts) => {
			if (schema === overrideMe) {
				return ts.factory.createTypeReferenceNode(
					ts.factory.createIdentifier('Overridden'),
				)
			} else {
				return undefined
			}
		},
	})
	expect(printNodeTest(node)).toMatchInlineSnapshot(`
		"{
		    override: Overridden;
		    dontOverride: string;
		}"
	`)
})
