import { Db } from 'mongodb'
import { z } from 'zod'

export type HandlerContext = {
	request: Request<unknown, CfProperties<unknown>>
	db: Db
	env: Env
}

export interface RouteHandlerWithSchema<TInput = unknown, TOutput = unknown> {
	inputSchema?: z.ZodType<TInput>
	outputSchema?: z.ZodType<TOutput>
	handler: (data: TInput, context: HandlerContext) => Promise<TOutput>
}

export type RouteHandler = (data: unknown, context: HandlerContext) => Promise<any>
