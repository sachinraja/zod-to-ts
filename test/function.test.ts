import { expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils'

it('prints correct typescript', () => {
	const schema = z.function().args(z.string().nullish().default('name'), z.boolean(), z.boolean()).returns(
		z.string(),
	)
	const { node } = zodToTs(schema, 'Function')

	expect(printNodeTest(node)).toMatchInlineSnapshot(
		'"(args_0: (string | undefined) | null, args_1: boolean, args_2: boolean, ...args_3: unknown[]) => string"',
	)
})

it('prints correct typescript 2', () => {
	const schema = z.function().args(z.object({ name: z.string(), price: z.number(), comment: z.string() })).describe(
		'create an item',
	)

	const { node } = zodToTs(schema)

	expect(printNodeTest(node)).toMatchInlineSnapshot(`
		"(args_0: {
		    name: string;
		    price: number;
		    comment: string;
		}, ...args_1: unknown[]) => unknown"
	`)
})
