export type ApiResponse<T> = {
  data: T
  code: 200 | 401 | 500
  msg: string
}
