import type { H3Event, EventHandler, EventHandlerRequest } from 'h3'
import type { ApiResponse } from '#shared/api'

export function apiResponse<T>(data: T, code: ApiResponse<unknown>['code'] = 200, msg = ''): ApiResponse<T> {
  return { data, code, msg }
}

export function defineApiHandler<T extends EventHandlerRequest, D>(handler: EventHandler<T, D>) {
  return defineEventHandler(async (event: H3Event) => {
    try {
      return apiResponse(await handler(event as never))
    } catch (error: any) {
      const code = Number(error?.statusCode || error?.status) === 401 ? 401 : 500
      return apiResponse(null, code, code === 401 ? 'Unauthorized' : error?.statusMessage || 'Internal server error')
    }
  })
}
