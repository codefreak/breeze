import { Config, useUseConfigQuery } from '../generated/graphql'

type ConfigField = keyof Config

interface UseConfigResult<T extends ConfigField> {
  data?: Config[T]
  loading: boolean
}

const useConfig = <T extends ConfigField>(field: T): UseConfigResult<T> => {
  const { data, loading } = useUseConfigQuery()

  return { data: data?.config[field], loading }
}

export default useConfig
