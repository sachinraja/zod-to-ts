import ts from 'typescript'

export type LiteralType = string | number | boolean

export type ZodToTsOptions = {
	/** @deprecated use `nativeEnums` instead */
	resolveNativeEnums?: boolean
	nativeEnums?: 'identifier' | 'resolve' | 'union'
}

export const resolveOptions = (raw?: ZodToTsOptions) => {
	const resolved = {
		nativeEnums: raw?.resolveNativeEnums ? 'resolve' : 'identifier',
	} satisfies ZodToTsOptions

	return { ...resolved, ...raw }
}

export type ResolvedZodToTsOptions = ReturnType<typeof resolveOptions>

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
	options: ResolvedZodToTsOptions,
) => ts.Identifier | ts.TypeNode

export type GetType = { _def: { getType?: GetTypeFunction } }
