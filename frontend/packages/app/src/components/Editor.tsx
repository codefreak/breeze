import React, { useState } from "react";
import { Col, Row, Tabs } from "antd";
import FileTree from "./FileTree";
import Monaco from "./Monaco";
import { BreezeComponent } from "../App";
import { basename } from "path";

import "./Editor.less";
import { insertAfter, remove } from "../lib/array";

// TODO: read backend config
const DEFAULT_FILE = "/main.py"

const Editor: React.FC = () => {
  const [fileStack, setFileStack] = useState<string[]>([DEFAULT_FILE]);
  const [currentFile, setCurrentFile] = useState<string>(DEFAULT_FILE);
  return (
    <Row style={{ height: "100%" }}>
      <Col span={7}>
        <BreezeComponent title="Files">
          <FileTree
            onClickFile={(path) => {
              // insert after current opened file
              setFileStack(insertAfter(fileStack, path, currentFile));
              setCurrentFile(path);
            }}
          />
        </BreezeComponent>
      </Col>
      <Col span={17}>
        <Tabs
          size="small"
          animated={false}
          type="editable-card"
          hideAdd
          className="editor-tabs"
          activeKey={currentFile ? currentFile : undefined}
          onTabClick={setCurrentFile}
          onEdit={(targetKey, action) => {
            if (action === "remove") {
              const path = targetKey.toString();
              const newFileStack = remove(fileStack, path);
              // select another file if current one is closed
              if (currentFile === path) {
                const newFileIndex = Math.min(
                  fileStack.indexOf(currentFile),
                  newFileStack.length - 1
                );
                setCurrentFile(newFileStack[newFileIndex]);
              }
              setFileStack(newFileStack);
            }
          }}
        >
          {fileStack.map((file) => (
            <Tabs.TabPane key={file} tab={basename(file)} />
          ))}
        </Tabs>
        {currentFile ? (
          <Monaco path={currentFile} />
        ) : (
          <div className="editor-no-open-file">Please select a file</div>
        )}
      </Col>
    </Row>
  );
};

export default Editor;
