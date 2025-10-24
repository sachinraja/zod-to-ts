import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createAuxiliaryTypeStore, zodToTs } from '../src'
import { printNodeTest } from './utils'

const PrimitiveSchema = z.object({
	username: z.string(),
	age: z.number(),
	isAdmin: z.boolean(),
	createdAt: z.date(),
	undef: z.undefined(),
	nu: z.null(),
	vo: z.void(),
	an: z.any(),
	unknow: z.unknown(),
	nev: z.never(),
})

describe('PrimitiveSchema', () => {
	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(PrimitiveSchema, { auxiliaryTypeStore })

	it('outputs correct typescript', () => {
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    username: string;
			    age: number;
			    isAdmin: boolean;
			    createdAt: Date;
			    undef?: undefined;
			    nu: null;
			    vo: void | undefined;
			    an: any;
			    unknow: unknown;
			    nev: never;
			}"
		`)
	})
})
