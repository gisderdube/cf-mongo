import { DurableObject } from 'cloudflare:workers'
import { MongoClient } from 'mongodb'

/**
 * Example usage:
 * ```ts
 * const id = env.MONGODB_CONNECTOR.idFromName('mongodb-connector')
 * const stub = env.MONGODB_CONNECTOR.get(id)
 * const doc = await stub.insertTestDoc()
 * ```
 */
export class MongoDBConnector extends DurableObject {
	private uri: string
	private dbName: string
	private client: MongoClient

	constructor(state: DurableObjectState, env: Env) {
		super(state, env)

		this.uri = env.MONGODB_URI
		this.dbName = env.MONGODB_DB
		console.log('MongoDBConnector constructor', this.uri, this.dbName)
		this.client = new MongoClient(this.uri)
	}

	async getDb() {
		const client = await this.client.connect()
		return client.db(this.dbName)
	}

	async insertTestDoc() {
		console.log('MongoDBConnector insertTestDoc', this.uri, this.dbName)
		const db = await this.getDb()
		const result = await db.collection('test').insertOne({
			date: new Date(),
		})
		const doc = await db.collection('test').findOne({ _id: result.insertedId })
		return JSON.parse(JSON.stringify(doc))
	}
}
