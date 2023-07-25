import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { withGetType, zodToTs } from '../src'
import { printNodeTest } from './utils'

describe('Color enum', () => {
	enum Color {
		Red,
		Green,
		Blue,
	}

	it('uses identifier provided using `withGetType`', () => {
		const schema = withGetType(
			z.nativeEnum(Color),
			(ts) => ts.factory.createIdentifier('Color'),
		)

		const { node } = zodToTs(schema)

		expect(printNodeTest(node)).toMatchInlineSnapshot('"Color"')
	})

	it('handles numeric literals with resolveNativeEnums', () => {
		const schema = withGetType(
			z.nativeEnum(Color),
			(ts) => ts.factory.createIdentifier('Color'),
		)

		const { store } = zodToTs(schema, undefined, { resolveNativeEnums: true })

		expect(printNodeTest(store.nativeEnums[0])).toMatchInlineSnapshot(`
			"enum Color {
			    \\"0\\" = \\"Red\\",
			    \\"1\\" = \\"Green\\",
			    \\"2\\" = \\"Blue\\",
			    Red = 0,
			    Green = 1,
			    Blue = 2
			}"
		`)
	})
})

describe('Fruit enum', () => {
	enum Fruit {
		Apple = 'apple',
		Banana = 'banana',
		Cantaloupe = 'cantaloupe',
	}

	it('handles string literals with resolveNativeEnums', () => {
		const schema = withGetType(
			z.nativeEnum(Fruit),
			(ts) => ts.factory.createIdentifier('Fruit'),
		)

		const { store } = zodToTs(schema, undefined, { nativeEnums: 'resolve' })

		expect(printNodeTest(store.nativeEnums[0])).toMatchInlineSnapshot(`
			"enum Fruit {
			    Apple = \\"apple\\",
			    Banana = \\"banana\\",
			    Cantaloupe = \\"cantaloupe\\"
			}"
		`)
	})
})

it('handles string literal properties', () => {
	enum StringLiteral {
		'Two Words',
		'\'Quotes"',
		'\\"Escaped\\"',
	}

	const schema = withGetType(
		z.nativeEnum(StringLiteral),
		(ts) => ts.factory.createIdentifier('StringLiteral'),
	)

	const { store } = zodToTs(schema, undefined, { nativeEnums: 'resolve' })

	expect(printNodeTest(store.nativeEnums[0])).toMatchInlineSnapshot(`
		"enum StringLiteral {
		    \\"0\\" = \\"Two Words\\",
		    \\"1\\" = \\"'Quotes\\\\\\"\\",
		    \\"2\\" = \\"\\\\\\\\\\\\\\"Escaped\\\\\\\\\\\\\\"\\",
		    \\"Two Words\\" = 0,
		    \\"'Quotes\\\\\\"\\" = 1,
		    \\"\\\\\\\\\\\\\\"Escaped\\\\\\\\\\\\\\"\\" = 2
		}"
	`)
})

describe('convertNativeEnumToUnion option', () => {
	it('handles number enum', () => {
		enum Color {
			Red,
			Green,
			Blue,
		}
		const schema = z.nativeEnum(Color)
		const { node } = zodToTs(schema, undefined, { nativeEnums: 'union' })
		expect(printNodeTest(node)).toMatchInlineSnapshot(`"\\"Red\\" | \\"Green\\" | \\"Blue\\" | 0 | 1 | 2"`)
	})

	it('handles string enum', () => {
		enum Fruit {
			Apple = 'apple',
			Banana = 'banana',
			Cantaloupe = 'cantaloupe',
		}
		const schema = z.nativeEnum(Fruit)
		const { node } = zodToTs(schema, undefined, { nativeEnums: 'union' })
		expect(printNodeTest(node)).toMatchInlineSnapshot(`"\\"apple\\" | \\"banana\\" | \\"cantaloupe\\""`)
	})
})
