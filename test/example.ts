/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod'
import { printNode, withGetType, zodToTs } from '../src'

enum Fruits {
	Apple = 'apple',
	Banana = 'banana',
	Cantaloupe = 'cantaloupe',
	A = 5,
}

const example2 = z.object({
	a: z.string(),
	b: z.number(),
	c: z.array(z.string()).nonempty().length(10),
	d: z.object({
		e: z.string(),
	}),
})

const pickedSchema = example2.partial()

const nativeEnum = withGetType(z.nativeEnum(Fruits), (ts, _, options) => {
	const identifier = ts.factory.createIdentifier('Fruits')

	if (options.nativeEnums === 'resolve') return identifier

	return ts.factory.createTypeReferenceNode(
		identifier,
	)
})

type ExampleLazy = {
	a: string
	b: ExampleLazy
}

const exampleLazy: z.ZodSchema<ExampleLazy> = withGetType(
	z.lazy(() => example3),
	(ts, identifier) =>
		ts.factory.createIndexedAccessTypeNode(
			ts.factory.createTypeReferenceNode(
				ts.factory.createIdentifier(identifier),
			),
			ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('b')),
		),
)

const example3 = z.object({
	a: z.string(),
	b: exampleLazy,
})

const dateType = withGetType(
	z.instanceof(Date),
	(ts) => ts.factory.createIdentifier('Date'),
)

export const example = z.object({
	a: z.string(),
	b: z.number(),
	c: z.array(z.object({
		a: z.string(),
	})),
	d: z.boolean(),
	e: exampleLazy,
	f: z.union([z.object({ a: z.number() }), z.literal('hi')]),
	g: z.enum(['hi', 'bye']),
	h: z.number().and(z.bigint()).and(z.number().and(z.string())).transform((argument) => console.log(argument)),
	i: z.date(),
	j: z.undefined(),
	k: z.null(),
	l: z.void(),
	m: z.any(),
	n: z.unknown(),
	o: z.never(),
	p: z.optional(z.string()),
	q: z.nullable(pickedSchema),
	r: z.tuple([z.string(), z.number(), z.object({ name: z.string() })]),
	s: z.record(z.object({
		de: z.object({
			me: z.union([z.tuple([z.string(), z.object({ a: z.string() })]), z.bigint()]).array(),
		}),
	})),
	t: z.map(z.string(), z.array(z.object({ p: z.string() }))),
	u: z.set(z.string()),
	v: z.intersection(z.string(), z.number()).or(z.bigint()),
	w: z.promise(z.number()),
	x: z.function().args(z.string().nullish().default('heo'), z.boolean(), z.boolean()).returns(z.string()),
	y: z.string().optional().default('hi'),
	z: z.string().refine((value) => value.length > 10).or(z.number()).and(z.bigint().nullish().default(1000n)),
	aa: nativeEnum,
	bb: dateType,
	cc: z.lazy(() => z.string()),
	dd: z.nativeEnum(Fruits),
	ee: z.discriminatedUnion('kind', [
		z.object({ kind: z.literal('circle'), radius: z.number() }),
		z.object({ kind: z.literal('square'), x: z.number() }),
		z.object({ kind: z.literal('triangle'), x: z.number(), y: z.number() }),
	]),
})

type A = z.infer<typeof example>['ee']

type B = z.infer<typeof pickedSchema>

const { node, store } = zodToTs(example, 'Example', { nativeEnums: 'resolve' })

console.log(printNode(node))

console.log('\n\nNative Enums\n---------------')
for (const nativeEnum of store.nativeEnums) {
	console.log(printNode(nativeEnum))
}
