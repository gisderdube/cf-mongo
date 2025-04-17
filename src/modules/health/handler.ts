import { z } from 'zod'
import { ServerError } from '../../errors/ServerError'
import { HandlerContext, RouteHandlerWithSchema } from '../types'

const healthInputSchema = z.object({
	fail: z.boolean().optional(),
})

const healthOutputSchema = z.object({
	_id: z.string().optional(),
	date: z.string().datetime(),
	status: z.literal('ok'),
})

type HealthInput = z.infer<typeof healthInputSchema>
type HealthOutput = z.infer<typeof healthOutputSchema>

async function handler({ fail }: HealthInput, { db, request, env }: HandlerContext): Promise<HealthOutput> {
	if (fail) {
		throw new ServerError(400, {
			userMessage: 'Health check failed due to input',
		})
	}

	const id = env.MONGODB_CONNECTOR.idFromName('mongodb-connector')
	const stub = env.MONGODB_CONNECTOR.get(id)
	const doc = await stub.insertTestDoc()
	// const result = await db.collection('test').insertOne({
	// 	date: new Date(),
	// })
	// const doc = await db.collection('test').findOne({ _id: result.insertedId })

	return {
		...JSON.parse(JSON.stringify(doc)),
		status: 'ok',
	}
}

const health: RouteHandlerWithSchema<HealthInput, HealthOutput> = {
	inputSchema: healthInputSchema,
	outputSchema: healthOutputSchema,
	handler,
}

export default health
