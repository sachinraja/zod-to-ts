import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { withGetType, zodToTs } from '../src'
import { printNodeTest } from './utils'

const dateType = withGetType(z.instanceof(Date), (ts) => ts.factory.createIdentifier('Date'))

const schema = z.object({
	name: z.string(),
	date: dateType,
})

describe('z.instanceof()', () => {
	const { node } = zodToTs(schema, 'Item')

	it('outputs correct typescript', () => {
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    name: string;
			    date: Date;
			}"
		`)
	})
})
