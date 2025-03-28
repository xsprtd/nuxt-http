import { type Ref, ref } from 'vue'
import type { ErrorBagInterface, Errors, FormValidationError, ResponseError } from '../types/Http'
import { useCurrentUser } from './useCurrentUser'

export const useErrorBag = (): ErrorBagInterface => {
  const message: Ref<string | null> = ref(null)
  const errors: Ref<Errors | null> = ref(null)

  const get = <T = false>(key: string, defaultValue?: T): string | T => {
    const payload = errors.value?.[key]
    return payload
      ? payload[0]
      : <T>defaultValue
  }

  const has = (key: string): boolean => {
    return !!errors.value?.[key]
  }

  const byStatusCode = (error: ResponseError): void => {
    switch (error?.response?.status) {
      case 422:
        unprocessable(error)
        break
      case 419:
        csrf(error)
        break
      case 401:
        unauthenticated()
        break
      default:
        general(error)
        break
    }
  }

  const general = (error: unknown): void => {
    console.warn('General error', error)
  }

  const unprocessable = (error: ResponseError): void => {
    const { message: m, errors: e } = error?.response?._data as FormValidationError
    message.value = m || null
    errors.value = e || null
  }

  const csrf = (error: unknown): void => {
    console.warn('CSRF token mismatch', error)
  }

  const unauthenticated = (): void => {
    const user = useCurrentUser()
    if (user.value !== null) {
      user.value = null
    }
  }

  const reset = (): void => {
    message.value = null
    errors.value = null
  }

  const handle = (error?: ResponseError | unknown): void => {
    if (!error) {
      return
    }

    const { response } = error as ResponseError

    if (response?.status) {
      byStatusCode(error)
    }
    else {
      general(error)
    }
  }

  return { message, errors, handle, reset, has, get }
}
