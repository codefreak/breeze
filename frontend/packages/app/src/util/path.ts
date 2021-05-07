import { join } from 'path'

/**
 * Get an absolute path from given path
 */
export const getCanonicalPath = (path: string): string => {
  return join('/', path)
}
