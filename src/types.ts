import ts from 'typescript'

export type LiteralType = string | number | boolean

export type ZodToTsOptions = {
	/** @deprecated please use nativeEnums instead */
	resolveNativeEnums?: boolean
	nativeEnums?: 'identifier' | 'resolve' | 'union'
}

export type ZodToTsStore = {
	nativeEnums: ts.EnumDeclaration[]
}

export type ZodToTsReturn = {
	node: ts.TypeNode
	store: ZodToTsStore
}

export type GetTypeFunction = (
	typescript: typeof ts,
	identifier: string,
	options: ZodToTsOptions,
) => ts.Identifier | ts.TypeNode

export type GetType = { _def: { getType?: GetTypeFunction } }
