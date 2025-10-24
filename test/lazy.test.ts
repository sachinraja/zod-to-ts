import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createAuxiliaryTypeStore, zodToTs } from '../src'
import { printNodeTest } from './utils'

const UserSchema = z.object({
	username: z.string(),
	get friends() {
		return z.array(UserSchema)
	},
})

describe('getter referencing root type', () => {
	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(UserSchema, { auxiliaryTypeStore })

	it('outputs correct typescript', () => {
		expect(printNodeTest(node)).toMatchInlineSnapshot(`"Auxiliary_0"`)
	})
})

describe('z.json()', () => {
	const jsonSchema: z.ZodType = z.json()

	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(jsonSchema, { auxiliaryTypeStore })

	it('outputs correct typescript', () => {
		expect(printNodeTest(node)).toMatchInlineSnapshot(`"Auxiliary_0"`)
	})

	it('does not create auxiliary type definition', () => {
		expect(
			auxiliaryTypeStore.definitions
				.values()
				.map((node) => ({
					identifier: printNodeTest(node.identifier),
					node: printNodeTest(node.node),
				}))
				.toArray(),
		).toMatchInlineSnapshot(`
			[
			  {
			    "identifier": "Auxiliary_0",
			    "node": "type Auxiliary_0 = string | number | boolean | null | Auxiliary_0[] | {
			    [key: string]: Auxiliary_0;
			};",
			  },
			]
		`)
	})
})

describe('z.lazy() with auxiliary type definition', () => {
	interface Like {
		liker: User
		likee: User
	}
	interface User {
		likes: Like[]
	}

	const LikeSchema: z.ZodType<Like> = z.object({
		liker: z.lazy(() => UserSchema),
		likee: z.lazy(() => UserSchema),
	})

	const UserSchema: z.ZodType<User> = z.object({
		id: z.number(),
		likes: z.array(z.lazy(() => LikeSchema)),
	})

	const MetaUserSchema = z.object({
		meta: z.string(),
		user: UserSchema,
	})

	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(MetaUserSchema, { auxiliaryTypeStore })

	it('outputs correct typescript', () => {
		expect(printNodeTest(node)).toMatchInlineSnapshot(`
			"{
			    meta: string;
			    user: Auxiliary_1;
			}"
		`)
	})

	it('creates auxiliary type definition for Like', () => {
		expect(
			auxiliaryTypeStore.definitions
				.values()
				.map((node) => ({
					identifier: printNodeTest(node.identifier),
					node: printNodeTest(node.node),
				}))
				.toArray(),
		).toMatchInlineSnapshot(`
			[
			  {
			    "identifier": "Auxiliary_1",
			    "node": "type Auxiliary_1 = {
			    id: number;
			    likes: {
			        liker: Auxiliary_1;
			        likee: Auxiliary_1;
			    }[];
			};",
			  },
			]
		`)
	})
})
