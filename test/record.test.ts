import { expect, it } from 'vitest'
import { z } from 'zod'
import { createAuxiliaryTypeStore, zodToTs } from '../src'
import { printNodeTest } from './utils'

it('prints correct typescript for record with string key', () => {
	const schema = z.record(z.string(), z.number())
	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(schema, { auxiliaryTypeStore })
	expect(printNodeTest(node)).toMatchInlineSnapshot(`
    "{
        [key: string]: number | undefined;
    }"
  `)
	expect(auxiliaryTypeStore.definitions.size).toBe(0)
})

it('prints correct typescript for partial record with string key', () => {
	const schema = z.partialRecord(z.string(), z.number())
	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(schema, { auxiliaryTypeStore })
	expect(printNodeTest(node)).toMatchInlineSnapshot(`
    "{
        [key: string]: number | undefined;
    }"
  `)
	expect(auxiliaryTypeStore.definitions.size).toBe(0)
})

it('prints correct typescript for record with enum key', () => {
	const schema = z.record(z.enum(['foo', 'bar']), z.number())
	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(schema, { auxiliaryTypeStore })
	expect(printNodeTest(node)).toMatchInlineSnapshot(`
    "{
        [key in "foo" | "bar"]: number;
    }"
  `)
	expect(auxiliaryTypeStore.definitions.size).toBe(0)
})

it('prints correct typescript for partial record with enum key', () => {
	const schema = z.partialRecord(z.enum(['foo', 'bar']), z.number())
	const auxiliaryTypeStore = createAuxiliaryTypeStore()
	const { node } = zodToTs(schema, { auxiliaryTypeStore })
	expect(printNodeTest(node)).toMatchInlineSnapshot(`
    "{
        [key in "foo" | "bar"]?: number;
    }"
  `)
	expect(auxiliaryTypeStore.definitions.size).toBe(0)
})
