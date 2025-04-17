import { Db, MongoClient, MongoClientOptions } from 'mongodb'

const options = {
	appName: 'cf-mongo',
	connectTimeoutMS: 5000,
	maxPoolSize: 1,
	minPoolSize: 0,
} as MongoClientOptions

export default async function connectDb({
	env,
	ctx,
	request,
}: {
	env: Env
	ctx: ExecutionContext
	request: Request
}): Promise<{ db: Db; client?: MongoClient }> {
	try {
		let db: Db
		let client: MongoClient | undefined

		client = new MongoClient(env.MONGODB_URI, options)
		await client.connect()
		const dbName = env.MONGODB_DB || 'cf-mongo-dev'
		db = client.db(dbName)

		return { db, client }
	} catch (error) {
		console.error('Database connection error:', error)
		throw error
	}
}
