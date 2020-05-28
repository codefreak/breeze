import React, { useEffect, useState } from "react";
import { debounce } from "ts-debounce";
import MonacoComp from "@monaco-editor/react";
import {
  useFileChangedSubscription,
  useGetFileQuery,
  useWriteFileMutation,
} from "../generated/graphql";
import { editor, Uri } from "monaco-editor";

const Monaco: React.FC<{ path: string }> = ({ path }) => {
  const model =
    editor.getModel(Uri.file(path)) ||
    editor.createModel("", undefined, Uri.file(path));
  const { data, refetch } = useGetFileQuery({ variables: { path } });
  const [writeFile] = useWriteFileMutation();
  const [monacoInstance, setMonacoInstance] = useState<
    editor.IStandaloneCodeEditor
  >();

  useFileChangedSubscription({
    onSubscriptionData: (data) => {
      if (data?.subscriptionData?.data?.fileChange?.path === path) {
        refetch();
      }
    },
  });

  useEffect(() => {
    if (monacoInstance) {
      monacoInstance.setModel(model);
    }
  }, [model, monacoInstance]);

  useEffect(() => {
    if (data?.file?.__typename === "File") {
      model.setValue(data.file.contents);
    }
  }, [model, data]);

  useEffect(() => {
    model.onDidChangeContent(
      debounce(() => {
        writeFile({
          variables: {
            path,
            contents: model.getValue(),
          },
        });
      }, 1000)
    );
  }, [writeFile, model, path]);

  return (
    <MonacoComp
      options={{ automaticLayout: true }}
      editorDidMount={(_, monaco) => {
        setMonacoInstance(monaco);
      }}
    />
  );
};

export default Monaco;
