/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod'
import {
	createAuxiliaryTypeStore,
	printNode,
	type TypeOverrideMap,
	zodToTs,
} from '../src'

const example2 = z.object({
	a: z.string(),
	b: z.number(),
	c: z.array(z.string()).nonempty().length(10),
	d: z.object({
		e: z.string(),
	}),
})

const pickedSchema = example2.partial()

type ExampleLazy = {
	a: string
	b: ExampleLazy
}

const exampleLazy: z.ZodSchema<ExampleLazy> = z.lazy(() => example3)

const example3 = z.object({
	a: z.string(),
	b: exampleLazy,
})

const dateType = z.instanceof(Date)

const overrides: TypeOverrideMap = new Map()
overrides.set(dateType, (ts) =>
	ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('Date')),
)

export const example = z.object({
	a: z.string(),
	b: z.number(),
	c: z.array(
		z.object({
			a: z.string(),
		}),
	),
	d: z.boolean(),
	e: exampleLazy,
	f: z.union([z.object({ a: z.number() }), z.literal('hi')]),
	g: z.enum(['hi', 'bye']),
	h: z.number().and(z.bigint()).and(z.number().and(z.string())),
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
	s: z.record(
		z.string(),
		z.object({
			de: z.object({
				me: z
					.union([
						z.tuple([z.string(), z.object({ a: z.string() })]),
						z.bigint(),
					])
					.array(),
			}),
		}),
	),
	t: z.map(z.string(), z.array(z.object({ p: z.string() }))),
	u: z.set(z.string()),
	v: z.intersection(z.string(), z.number()).or(z.bigint()),
	w: z.promise(z.number()),
	x: z.function({
		input: [z.string().nullish().default('heo'), z.boolean(), z.boolean()],
		output: z.string(),
	}),
	y: z.string().optional().default('hi'),
	z: z.string().or(z.number()).and(z.bigint().nullish().default(1000n)),
	bb: dateType,
	cc: z.lazy(() => z.string()),
	ee: z.discriminatedUnion('kind', [
		z.object({ kind: z.literal('circle'), radius: z.number() }),
		z.object({ kind: z.literal('square'), x: z.number() }),
		z.object({ kind: z.literal('triangle'), x: z.number(), y: z.number() }),
	]),
})

const { node } = zodToTs(example, {
	auxiliaryTypeStore: createAuxiliaryTypeStore(),
	overrides,
})

console.log(printNode(node))
