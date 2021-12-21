import ts from 'typescript'
const { factory: f } = ts

export const maybeIdentifierToTypeReference = (identifier: ts.Identifier | ts.TypeNode) => {
  if (ts.isIdentifier(identifier)) {
    return f.createTypeReferenceNode(identifier)
  }

  return identifier
}

export const createTypeReferenceFromString = (identifier: string) =>
  f.createTypeReferenceNode(f.createIdentifier(identifier))

export const createTypeAlias = (node: ts.TypeNode, identifier: string) => {
  return f.createTypeAliasDeclaration(
    undefined,
    undefined,
    f.createIdentifier(identifier),
    undefined,
    node,
  )
}

export const printNode = (node: ts.Node, printerOptions?: ts.PrinterOptions) => {
  const sourceFile = ts.createSourceFile('print.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
  const printer = ts.createPrinter(printerOptions)
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
}
