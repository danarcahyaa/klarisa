/**
 * Generic Base Response Interface untuk seluruh API & Service di platform Klarisa
 */
export interface BaseResponse<T = unknown> {
  success: boolean
  data?: T | null
  error?: string | null
  message?: string
}
