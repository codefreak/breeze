import {
  useWriteReplDataMutation,
  WriteReplDataMutationResult,
} from "../generated/graphql";
import { useCallback } from "react";

interface MutationWriter {
  (data: string): void;
}

const useReplWriteData = (
  id: string
): [MutationWriter, WriteReplDataMutationResult] => {
  const [writeShellData, result] = useWriteReplDataMutation();

  const writer = useCallback(
    (data: string) => {
      return writeShellData({ variables: { id, data } });
    },
    [id, writeShellData]
  );

  return [writer, result];
};

export default useReplWriteData;
