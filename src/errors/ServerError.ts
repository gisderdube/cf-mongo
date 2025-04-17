import { z } from 'zod'

export class ServerError extends Error {
	statusCode: number
	userMessage?: string
	devMessage?: string
	data?: any

	constructor(
		statusCode: number = 500,
		{
			userMessage = 'Something went wrong... Please try again later or contact support.',
			devMessage,
			data,
		}: { userMessage?: string; devMessage?: string; data?: any },
	) {
		super(userMessage)
		this.name = 'ServerError'
		this.statusCode = statusCode
		this.userMessage = userMessage
		this.devMessage = devMessage
		this.data = data
	}
}

export class ValidationError extends Error {
	issues: z.ZodIssue[]

	constructor(issues: z.ZodIssue[]) {
		super('Validation Error')
		this.name = 'ValidationError'
		this.issues = issues
	}
}
