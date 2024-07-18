import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodToTs } from '../src'
import { printNodeTest } from './utils'

const OptionalStringSchema = z.string().optional()

const ObjectWithOptionals = z.object({
	optional: OptionalStringSchema,
	required: z.string(),
	transform: z.number().optional().transform((number_) => number_),
	or: z.number().optional().or(z.string()),
	tuple: z.tuple([
		z.string().optional(),
		z.number(),
		z.object({
			optional: z.string().optional(),
			required: z.string(),
		}),
	]).optional(),
})

describe('z.optional()', () => {
	it('outputs correct typescript', () => {
		const { node } = zodToTs(OptionalStringSchema)
		expect(printNodeTest(node)).toMatchInlineSnapshot('"string | undefined"')
	})

	it('should output `?:` and undefined union for optional properties', () => {
		const { node } = zodToTs(ObjectWithOptionals)

		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    optional?: string;
			    required: string;
			    transform?: number | undefined;
			    or?: (number | undefined) | string;
			    tuple?: [
			        string | undefined,
			        number,
			        {
			            optional?: string;
			            required: string;
			        }
			    ];
			}"
		`)
	})
})

const NullableUsernameSchema = z.object({
	username: z.string().nullable(),
})

describe('z.nullable()', () => {
	const { node } = zodToTs(NullableUsernameSchema)

	it('outputs correct typescript', () => {
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    username: string | null;
			}"
		`)
	})
})
