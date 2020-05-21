import React, { useCallback, useEffect, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { debounce } from "ts-debounce";
import "./XTerm.less"

interface XTermProps {
  onReady?: (terminal: Terminal) => void;
}

const XTerm: React.FC<XTermProps> = ({ onReady }) => {
  const [shellRootRef, setShellRootRef] = useState<HTMLDivElement>();
  const [terminal, setTerminal] = useState<Terminal>();

  useEffect(() => {
    if (shellRootRef && !terminal) {
      const newTerminal = new Terminal();
      newTerminal.open(shellRootRef);
      setTerminal(newTerminal);
    } else if (!shellRootRef) {
      setTerminal(undefined);
    }
  }, [setTerminal, shellRootRef, terminal]);

  useEffect(() => {
    if (terminal) {
      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      fitAddon.fit();
      const resizeHandler = debounce(() => {
        console.log("Resize")
        fitAddon.fit();
      }, 50);
      window.addEventListener("resize", resizeHandler);

      if (onReady) {
        onReady(terminal);
      }

      return () => {
        window.removeEventListener("resize", resizeHandler);
      };
    }
  }, [terminal, onReady]);

  const createShellRootRef = useCallback((ref: any) => {
    setShellRootRef(ref);
  }, []);

  return (
    <div
      className="shell-root"
      ref={createShellRootRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default XTerm;
