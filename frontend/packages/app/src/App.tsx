import React, { useEffect, useState } from "react";
import { Col, Layout, Row, Spin, Button } from "antd";
import { PlaySquareFilled } from "@ant-design/icons";
import Shell from "./Shell";
import { ReplType, useCreateReplMutation } from "./generated/graphql";
import { Terminal } from "xterm";

import "./App.less";
import { SubscriptionClient } from "subscriptions-transport-ws";
import Editor from "./components/Editor";

const { Header, Content, Footer } = Layout;

export const BreezeComponent: React.FC<{ title: string }> = (props) => {
  return (
    <div className="component">
      <div className="component-header">{props.title}</div>
      <div className="component-body">{props.children}</div>
    </div>
  );
};

interface IAppProps {
  subClient: SubscriptionClient;
}

const App: React.FC<IAppProps> = ({ subClient }) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(true);
  const [replId, setReplId] = useState<string>();
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<string>();
  const [runCode] = useCreateReplMutation({
    variables: { type: ReplType.Run },
  });
  const [createDefaultRepl] = useCreateReplMutation({
    variables: { type: ReplType.Default },
  });
  useEffect(() => {
    if (!replId) {
      createDefaultRepl().then((resp) => {
        if (resp.data) {
          setReplId(resp.data.createRepl);
        }
      });
    }
  }, [replId, createDefaultRepl]);

  useEffect(() => {
    const connected = () => {
      setConnected(true);
      setConnecting(false);
    };
    const connecting = () => {
      setConnected(false);
      setConnecting(true);
    };
    subClient.onConnected(connected);
    subClient.onReconnected(connected);
    subClient.onConnecting(connecting);
    subClient.onDisconnected(() => setConnected(false));
    subClient.onReconnecting(connecting);
  }, [subClient]);

  const onRunClick = () => {
    setRunning(true);
    runCode().then((resp) => {
      if (resp.data) {
        setRunId(resp.data.createRepl);
      }
    });
  };

  const onRunExit = (
    terminal: Terminal,
    exitCode: number,
    purgeBuffer: () => void
  ) => {
    terminal.writeln(`\nProcess finished with exit code ${exitCode}`);
    terminal.writeln("Press any key to continue...");
    terminal.onData(() => {
      setRunId(undefined);
      setRunning(false);
      // clear local stored data of buffer
      purgeBuffer();
    });
  };

  const onReplExit = (terminal: Terminal, exitCode: number) => {
    // force repl re-creation
    setReplId(undefined);
  };

  return (
    <Layout style={{ height: "100%", overflow: "hidden" }}>
      <Header
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          borderBottom: "1px solid white",
        }}
      >
        <Row>
          <Col span={12}>
            <h1 style={{ color: "white" }}>
              <img
                src={process.env.PUBLIC_URL + "/breeze-logo.svg"}
                alt="Breeze Logo"
                height={24}
                style={{ marginRight: ".5em" }}
              />
              breeze
            </h1>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Button
              icon={<PlaySquareFilled />}
              onClick={onRunClick}
              loading={running}
              type="primary"
            >
              Run Code
            </Button>
          </Col>
        </Row>
      </Header>
      <Content>
        <Row style={{ height: "100%", overflow: "hidden" }}>
          <Col span={14} style={{ height: "100%" }}>
            <Editor />
          </Col>
          <Col span={10}>
            <BreezeComponent title="Run Output">
              {runId ? (
                <Shell replId={runId} onExit={onRunExit} />
              ) : replId ? (
                <Shell replId={replId} onExit={onReplExit} />
              ) : (
                <Spin />
              )}
            </BreezeComponent>
          </Col>
        </Row>
      </Content>
      <Footer className="footer">
        {connected ? "Connected" : "Disconnected!"}
        {!connected && connecting ? "Connecting…" : null}
      </Footer>
    </Layout>
  );
};

export default App;
