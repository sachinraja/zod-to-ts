import type { Node } from 'typescript/unstable/ast'
import { printNode } from '../src'

export const printNodeTest = (node: Node) => printNode(node)
