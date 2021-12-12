import ts from 'typescript'

export const maybeIdentifierToTypeReference = (identifier: ts.Identifier | ts.TypeNode) => {
  if (ts.isIdentifier(identifier)) {
    return ts.factory.createTypeReferenceNode(identifier)
  }

  return identifier
}

export const createTypeReferenceFromString = (identifier: string) =>
  ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(identifier))
