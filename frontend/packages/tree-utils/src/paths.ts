import { dirname, resolve } from 'path'
import { objectListToTree, PropertiesOfType } from './common'

const abspath = (path: string) => resolve('/', path)
const isSamePath = (a: string, b: string) => abspath(a) === abspath(b)

export const listToTreeByPath = <
  T extends { [key in S]: string },
  S extends PropertiesOfType<T, string>
>(
  list: T[],
  pathProperty: S
) => {
  const pathExtract = (obj: T) => abspath(obj[pathProperty])
  const parentPathExtract = (obj: T) => {
    const path = pathExtract(obj)
    if (path === '/') return undefined
    return dirname(path)
  }
  return objectListToTree(list, pathExtract, parentPathExtract)
}
/**
 * List all directory names of path and all parents
 *
 * @param path
 */
const dirnames = (path: string): string[] => {
  const dirs: string[] = []
  while (!isSamePath(dirname(path), path)) {
    dirs.push((path = dirname(path)))
  }
  return dirs
}

export const fillMissingPaths = <
  T extends { [key in S]: string },
  S extends PropertiesOfType<T, string>
>(
  list: T[],
  pathProperty: S
) => {
  const neededPaths: string[] = []
  const foundPaths: string[] = []
  for (let i = 0; i < list.length; i++) {
    const path = list[i][pathProperty]
    foundPaths.push(abspath(path))
    neededPaths.push(...dirnames(path))
  }
  const pathDiff = Array.from(new Set(neededPaths)).filter(
    path => !foundPaths.includes(path)
  )
  const newPaths = pathDiff.map(path => ({ [pathProperty]: path }))
  return [...list, ...newPaths]
}
