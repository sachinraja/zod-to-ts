import ts from 'typescript'
import { printNode } from '../src'

export const printNodeTest = (node: ts.Node) =>
	printNode(node, { newLine: ts.NewLineKind.LineFeed })
