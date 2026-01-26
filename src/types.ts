import type ts from 'typescript'
import * as z4 from 'zod/v4/core'

/** A function which overrides the default Zod to TypeScript mapping.
 * @param typescript TypeScript compiler interface for creating AST nodes
 * @param options The options that were passed to `zodToTs`
 * @returns the TypeScript AST node for this Zod type
 */
export type TypeOverrideFunction = (
	typescript: typeof ts,
	options: ZodToTsOptions,
) => ts.TypeNode

/** A function which may optionally override the default Zod to TypeScript mapping.
 * @param schema Zod schema to potentially override
 * @param typescript TypeScript compiler interface for creating AST nodes
 * @param options The options that were passed to `zodToTs`
 * @returns the TypeScript AST node for this Zod type, or `undefined` if this Zod type should not be overridden
 */
export type OptionalTypeOverrideFunction = (
	schema: z4.$ZodType,
	typescript: typeof ts,
	options: ZodToTsOptions,
) => ts.TypeNode | undefined

export type TypeOverrideMap = Map<z4.$ZodType, TypeOverrideFunction>

interface OptionalZodToTsOptions {
	/**
	 * A registry of Zod schemas to override the type generation for.
	 * Takes precedence over `overrideFunction`.
	 */
	overrides: TypeOverrideMap
	/**
	 * A function to optionally override Zod types not matched in `overrides`.
	 * Types that appear in `overrides` will be mapped there instead of passed to this function.
	 */
	overrideFunction: OptionalTypeOverrideFunction
}

interface WithDefaultZodToTsOptions {
	/** A registry used to look up metadata for each schema.
	 *  @default globalRegistry
	 * */
	metadataRegistry?: z4.$ZodRegistry<{ description?: string }>

	/** How to handle unrepresentable types.
	 * - `"throw"` — Default. Unrepresentable types throw an error
	 * - `"any"` — Unrepresentable types become `{}`
	 */
	unrepresentable: 'throw' | 'any'

	/** Whether to extract the `"input"` or `"output"` type. Relevant to transforms, Error converting schema to JSONz, defaults, coerced primitives, etc.
	 * - `"output"` — Default. Convert the output schema.
	 * - `"input"` — Convert the input schema.
	 */
	io: 'input' | 'output'
}

export interface AuxiliaryTypeDefinition {
	identifier: ts.Identifier
	node: ts.TypeAliasDeclaration
}

export interface AuxiliaryTypeStore {
	nextId: () => string
	definitions: Map<z4.$ZodType, AuxiliaryTypeDefinition>
}

interface RequiredZodToTsOptions {
	auxiliaryTypeStore: AuxiliaryTypeStore
}

export interface ZodToTsOptions
	extends Partial<OptionalZodToTsOptions>,
		Partial<WithDefaultZodToTsOptions>,
		RequiredZodToTsOptions {}

export interface ResolvedZodToTsOptions
	extends Partial<OptionalZodToTsOptions>,
		WithDefaultZodToTsOptions,
		RequiredZodToTsOptions {}

export function resolveOptions(
	options: ZodToTsOptions,
): ResolvedZodToTsOptions {
	return {
		unrepresentable: options.unrepresentable ?? 'throw',
		io: options.io ?? 'output',
		overrides: options.overrides,
		overrideFunction: options.overrideFunction,
		metadataRegistry: options.metadataRegistry ?? z4.globalRegistry,
		auxiliaryTypeStore: options.auxiliaryTypeStore,
	}
}
