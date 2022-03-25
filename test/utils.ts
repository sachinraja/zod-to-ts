import ts, { NewLineKind } from 'typescript'
import { printNode } from '../src'

export const printNodeTest = (node: ts.Node) => printNode(node, { newLine: NewLineKind.LineFeed })
