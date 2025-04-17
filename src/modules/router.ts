import health from './health/handler'
import { RouteHandler, RouteHandlerWithSchema } from './types'

export const router: Record<string, RouteHandler | RouteHandlerWithSchema<any, any>> = {
	'/': health,
	'/health': health,
}
