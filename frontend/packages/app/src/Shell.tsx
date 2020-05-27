import React, { useEffect, useState } from "react";
import { Terminal } from "xterm";
import useReplWriteData from "./hooks/useReplWriteData";
import XTerm from "./components/XTerm";
import useReplOutput from "./hooks/useReplOutput";
import useReplExit from "./hooks/useReplExit";

export interface ShellProps {
  replId: string;
  onExit?: (terminal: Terminal, exitCode: number) => void;
}

const Shell: React.FC<ShellProps> = ({ replId, onExit }) => {
  const [exitCode, setExitCode] = useState<number>();
  const [terminal, setTerminal] = useState<Terminal>();
  const [writeData] = useReplWriteData(replId);

  useReplOutput(
    replId,
    (data) => {
      if (terminal && exitCode === undefined) {
        terminal.write(data);
      }
    },
    { skip: !terminal }
  );

  useReplExit(replId, setExitCode, { skip: !terminal });

  useEffect(() => {
    if (exitCode !== undefined && terminal && onExit) {
      onExit(terminal, exitCode)
    }
  }, [terminal, exitCode, onExit]);

  useEffect(() => {
    if (terminal) {
      // TODO: make resize work again
      //resize(terminal.cols, terminal.rows);
      terminal.onData((data: string) => {
        writeData(data);
      });
    }
  }, [terminal, writeData]);

  // TODO: "key" is used to force re-render
  return <XTerm key={replId} onReady={setTerminal} />;
};

export default Shell;
