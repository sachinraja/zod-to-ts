import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createAuxiliaryTypeStore, createTypeAlias, zodToTs } from '../src'
import { printNodeTest } from './utils'

const UserSchema = z.object({
	username: z.string(),
	age: z.number(),
})

const identifier = 'User'

describe('type alias', () => {
	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(UserSchema, { auxiliaryTypeStore })

	it('outputs correct typescript', () => {
		const typeAlias = createTypeAlias(node, identifier)

		expect(printNodeTest(typeAlias)).toMatchInlineSnapshot(`
			"type User = {
			    username: string;
			    age: number;
			};"
		`)
	})

	it('optionally takes a comment', () => {
		const typeAlias = createTypeAlias(node, identifier, 'A basic user')

		expect(printNodeTest(typeAlias)).toMatchInlineSnapshot(`
			"/** A basic user */
			type User = {
			    username: string;
			    age: number;
			};"
		`)
	})
})
