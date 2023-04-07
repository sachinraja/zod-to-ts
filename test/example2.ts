import { z } from 'zod'
import { printNode, withGetType, zodToTs } from '../src'

const Enum = z.nativeEnum({
	ONE: 1,
	TWO: 2,
})

withGetType(Enum, ts => ts.factory.createIdentifier('Enum'))

const schema = z.object({
	key: Enum.describe('Comment for key'),
})

const { node } = zodToTs(schema, undefined, { resolveNativeEnums: true })
console.log(printNode(node))
// {
//     /** Comment for key */
//     key: unknown;
// }
