import ts from 'typescript'

export const maybeIdentifierToTypeReference = (identifier: ts.Identifier | ts.TypeNode) => {
  if (ts.isIdentifier(identifier)) {
    return ts.factory.createTypeReferenceNode(identifier)
  }

  return identifier
}

export const createTypeReferenceFromString = (identifier: string) =>
  ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(identifier))

export const createTypeAlias = (identifier: string, node: ts.TypeNode) => {
  return ts.factory.createTypeAliasDeclaration(
    undefined,
    undefined,
    ts.factory.createIdentifier(identifier),
    undefined,
    node,
  )
}

export const printNode = (node: ts.Node, printerOptions?: ts.PrinterOptions) => {
  const sourceFile = ts.createSourceFile('print.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
  const printer = ts.createPrinter(printerOptions)
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
}
