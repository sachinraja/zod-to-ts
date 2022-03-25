import ts, { NewLineKind } from 'typescript'
import { printNode } from '../src/index.js'

export const printNodeTest = (node: ts.Node) => printNode(node, { newLine: NewLineKind.LineFeed })
