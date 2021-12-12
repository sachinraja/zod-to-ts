import typescript from 'typescript'

export type GetTypeFunction = (ts: typeof typescript, identifier: string) => typescript.TypeNode

export type GetType = { getType?: GetTypeFunction }

export type LiteralType = string | number | boolean
