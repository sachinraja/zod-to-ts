import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createAuxiliaryTypeStore, zodToTs } from '../src'
import { printNodeTest } from './utils'

const OptionalStringSchema = z.string().optional()

const ObjectWithOptionals = z.object({
	optional: OptionalStringSchema,
	required: z.string(),
	or: z.number().optional().or(z.string()),
	tuple: z
		.tuple([
			z.string().optional(),
			z.number(),
			z.object({
				optional: z.string().optional(),
				required: z.string(),
			}),
		])
		.optional(),
})

describe('z.optional()', () => {
	it('outputs correct typescript', () => {
		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(OptionalStringSchema, { auxiliaryTypeStore })
		expect(printNodeTest(node)).toMatchInlineSnapshot('"string | undefined"')
	})

	it('should output `?:` and undefined union for optional properties', () => {
		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(ObjectWithOptionals, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    optional?: string | undefined;
			    required: string;
			    or?: (number | undefined) | string;
			    tuple?: [
			        string | undefined,
			        number,
			        {
			            optional?: string | undefined;
			            required: string;
			        }
			    ] | undefined;
			}"
		`)
	})
})

const NullableUsernameSchema = z.object({
	username: z.string().nullable(),
})

describe('z.nullable()', () => {
	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(NullableUsernameSchema, { auxiliaryTypeStore })

	it('outputs correct typescript', () => {
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    username: string | null;
			}"
		`)
	})
})

describe('z.nonoptional()', () => {
	it('removes optional modifier', () => {
		const schema = z.object({ str: z.string().optional().default('hi') })

		const auxiliaryTypeStore = createAuxiliaryTypeStore()
		const { node } = zodToTs(schema, { auxiliaryTypeStore })

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    str: string | undefined;
			}"
		`)
	})
})
