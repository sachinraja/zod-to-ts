import { expect, it } from 'vitest'
import { z } from 'zod'
import { createAuxiliaryTypeStore, zodToTs } from '../src'
import { printNodeTest } from './utils'

it('prints correct typescript', () => {
	const schema = z.function({
		input: [z.string().nullish().default('name'), z.boolean(), z.boolean()],
		output: z.string(),
	})

	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(schema, { auxiliaryTypeStore })

	expect(printNodeTest(node)).toMatchInlineSnapshot(
		`"(args_0: (string | null) | undefined, args_1: boolean, args_2: boolean) => string"`,
	)
})

it('prints correct typescript 2', () => {
	const schema = z
		.function({
			input: [
				z.object({ name: z.string(), price: z.number(), comment: z.string() }),
			],
			output: z.unknown(),
		})
		.describe('create an item')

	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(schema, { auxiliaryTypeStore })

	expect(printNodeTest(node)).toMatchInlineSnapshot(`
		"(args_0: {
		    name: string;
		    price: number;
		    comment: string;
		}) => unknown"
	`)
})
