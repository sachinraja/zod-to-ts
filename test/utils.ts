import ts from 'typescript'
import { printNode } from '../src'

export const printNodeTest = (node: ts.Node) => printNode(node, { newLine: ts.NewLineKind.LineFeed })

/**
 * Removes indentation from inline multiline strings
 * Useful for unit tests
 *
 * An alternative to Vi.JestAssertion.toMatchInlineSnapshot,
 * because it adds annoying quotes to the snapshot text
 */
export const stripIndent = (indented: string): string => {
  const lines = indented.split("\n")
  // eslint-disable-next-line unicorn/no-array-reduce
  const commonIndent = lines.reduce((accumulator, line) => {
    if(/^\s*$/.test(line)) return accumulator
    const whiteSpaceMatch = /^\s*/.exec(line)
    const lineIndentLength = whiteSpaceMatch ? whiteSpaceMatch[0].length : 0;
    return Math.min(accumulator, lineIndentLength)
  }, Number.MAX_SAFE_INTEGER)

  const withoutIndent = lines.map(line => line.slice(commonIndent)).join("\n")
  // remove one leading and trailing newline, but no more than one
  return withoutIndent.replace(/^\n/, "").replace(/\n$/,"")
}