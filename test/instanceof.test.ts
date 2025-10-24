import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createAuxiliaryTypeStore, type TypeOverrideMap, zodToTs } from '../src'
import { printNodeTest } from './utils'

const typeOverrideRegistry: TypeOverrideMap = new Map()

const dateSchema = z.instanceof(Date)

typeOverrideRegistry.set(dateSchema, (ts) =>
	ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('Date')),
)

const schema = z.object({
	name: z.string(),
	date: dateSchema,
})

describe('z.instanceof()', () => {
	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(schema, {
		overrides: typeOverrideRegistry,
		auxiliaryTypeStore,
	})

	it('outputs correct typescript', () => {
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    name: string;
			    date: Date;
			}"
		`)
	})
})
