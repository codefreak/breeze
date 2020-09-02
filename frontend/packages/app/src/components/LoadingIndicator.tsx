import React from "react";
import {Spin} from "antd";

const LoadingIndicator: React.FC = () => {
    return <div style={{width: '100%', height: '100%', display: "flex", alignItems: 'center', flexDirection: 'row'}}>
        <Spin style={{margin: "auto"}} />
    </div>
}

export default LoadingIndicator