import { MongoClient } from 'mongodb'
import { z } from 'zod'
import { ServerError, ValidationError } from './errors/ServerError'
import { router } from './modules/router'
import { RouteHandler, RouteHandlerWithSchema } from './modules/types'

export { MongoDBConnector } from './durable/MongoDBConnector'

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)
		const path = url.pathname

		if (request.method === 'GET') {
			const data = Object.fromEntries(url.searchParams.entries())
			return handleRequest({ path, data, request, env, ctx })
		} else if (request.method === 'POST') {
			try {
				const data = await request.json()
				return handleRequest({ path, data, request, env, ctx })
			} catch (error) {
				return createErrorResponse({
					statusCode: 400,
					userMessage: 'Invalid JSON body',
					devMessage: error instanceof Error ? error.message : 'Failed to parse JSON',
				})
			}
		} else {
			return createErrorResponse({
				statusCode: 405,
				userMessage: 'Method not allowed',
				devMessage: `Method ${request.method} is not supported`,
			})
		}
	},
} satisfies ExportedHandler<Env>

async function handleRequest({
	path,
	data,
	request,
	env,
	ctx,
}: {
	path: string
	data: unknown
	request: Request
	env: Env
	ctx: ExecutionContext
}): Promise<Response> {
	try {
		// Look up the handler for this path and method
		const handler = router[path]

		if (!handler) {
			// Return 404 if no handler is found
			return createErrorResponse({ statusCode: 404, userMessage: 'Resource not found', devMessage: 'Route handler not found' })
		}

		try {
			// Create context object
			// const { db, client: dbClient } = await connectDb({ env, ctx, request })
			const db = undefined
			const dbClient = undefined
			const context = { request, db, env, ctx }

			// Execute the handler with validation if it has schemas
			if ('inputSchema' in handler && 'handler' in handler) {
				// Handler with schema validation
				const handlerWithSchema = handler as RouteHandlerWithSchema<unknown, unknown>

				// Validate input if schema is provided
				let validatedInput = data
				if (handlerWithSchema.inputSchema) {
					try {
						validatedInput = await handlerWithSchema.inputSchema.parseAsync(data)
					} catch (err) {
						if (err instanceof z.ZodError) {
							return createErrorResponse(
								{
									statusCode: 400,
									userMessage: 'Input validation error',
									devMessage: 'Input validation failed',
									data: { issues: err.issues },
								},
								{ dbClient, ctx },
							)
						}
						throw err
					}
				}

				// Execute handler with validated input
				const result = await handlerWithSchema.handler(validatedInput, context)

				// Validate output if schema is provided
				if (handlerWithSchema.outputSchema) {
					try {
						const validatedOutput = await handlerWithSchema.outputSchema.parseAsync(result)
						return createSuccessResponse(validatedOutput, { dbClient, ctx })
					} catch (err) {
						if (err instanceof z.ZodError) {
							console.error('Output validation error:', err.issues)
							return createErrorResponse(
								{
									statusCode: 500,
									userMessage: 'Server error',
									devMessage: 'Output validation failed',
									data: { issues: err.issues },
								},
								{ dbClient, ctx },
							)
						}
						throw err
					}
				}

				return createSuccessResponse(result, { dbClient, ctx })
			} else {
				// Legacy handler without schema
				const legacyHandler = handler as RouteHandler
				const result = await legacyHandler(data, context)
				return createSuccessResponse(result, { dbClient, ctx })
			}
		} catch (error) {
			// Handle expected ServerErrors
			if (error instanceof ServerError) {
				return createErrorResponse({
					statusCode: error.statusCode,
					userMessage: error.userMessage || 'Something went wrong... Please try again later or contact support.',
					devMessage: error.devMessage,
					data: error.data,
				})
			}

			// Handle ValidationError
			if (error instanceof ValidationError) {
				return createErrorResponse({
					statusCode: 400,
					userMessage: 'Validation error',
					devMessage: 'Validation failed',
					data: { issues: error.issues },
				})
			}

			// Log unexpected errors
			console.error('Unhandled error in handler:', error)

			// Return generic 500 error for unexpected errors
			return createErrorResponse({ statusCode: 500, userMessage: 'Internal server error' })
		}
	} catch (error) {
		// Handle global errors - this should rarely happen
		console.error('Global error:', error)
		return createErrorResponse({ statusCode: 500, userMessage: 'Something went wrong' })
	}
}

async function createSuccessResponse(data: any, { dbClient, ctx }: { dbClient?: MongoClient; ctx: ExecutionContext }): Promise<Response> {
	if (dbClient) {
		const closePromise = dbClient.close()
		if (ctx?.waitUntil) {
			ctx.waitUntil(closePromise)
		} else {
			await closePromise
		}
	}

	return new Response(JSON.stringify(data), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	})
}

async function createErrorResponse(
	{
		statusCode,
		userMessage,
		devMessage,
		data,
	}: {
		statusCode: number
		userMessage: string
		devMessage?: string
		data?: any
	},
	{ dbClient, ctx }: { dbClient?: MongoClient; ctx?: ExecutionContext } = {},
): Promise<Response> {
	if (dbClient) {
		const closePromise = dbClient.close()
		if (ctx?.waitUntil) {
			ctx.waitUntil(closePromise)
		} else {
			await closePromise
		}
	}

	const responseBody = {
		error: userMessage,
		devMessage,
		...(data ? { data } : {}),
	}

	return new Response(JSON.stringify(responseBody), {
		status: statusCode,
		headers: { 'Content-Type': 'application/json' },
	})
}
