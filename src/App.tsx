import React, { useState } from "react";
import "./constants.css";
import "./app.css";
import "./fonts.css";
import { CheckOptimismBridgeStatus, IStatus, Severity } from "./logic";

export const App = () => {
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [status, setStatus] = useState<IStatus>({ severity: Severity.Unknown, text: "Checks not ran yet" });

    const checkStatus = async () => {
        setIsRunning((current) => true);
        for await (const status of CheckOptimismBridgeStatus()) {
            setStatus((current) => status);
        }
        setIsRunning((current) => false);
    };

    return (
        <div className="wrapper">
            <div className="title">Optimism Bridge Health Checker</div>

            <div className="checker">
                <div className="checker__label">
                    Press this button to check the current status of the Optimism Bridge
                </div>
                <button disabled={isRunning} onClick={checkStatus} className="checker__button">
                    Check
                </button>
                <div className="checker__result">
                    <div
                        className={`checker__result-icon checker__result-icon--${status.severity}`}
                    />
                    <div className={`checker__result-text`}>{status.text}</div>
                </div>
            </div>

            <div className="credits">By 0xSwego, code <a href="https://github.com/0xSwego/OptimismBridgeHealthChecker">here</a></div>
        </div>
    );
};
