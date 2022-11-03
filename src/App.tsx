import React, { useEffect, useState } from "react";
import "./constants.css";
import "./app.css";
import "./fonts.css";
import { CheckOptimismBridgeStatus, IStatus, Severity } from "./logic";

export const App = () => {
    const [status, setStatus] = useState<IStatus>({ severity: Severity.Unknown });
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const checkStatus = async () => {
        setIsLoading((current) => true);
        const status = await CheckOptimismBridgeStatus();
        setStatus(status);
        setIsLoading((current) => false);
    };

    return (
        <div className="wrapper">
            <div className="title">Optimism Bridge Health Checker</div>

            <div className="checker">
                <div className="checker__label">
                    Press this button to check the current status of the Optimism Bridge
                </div>
                <button onClick={checkStatus} className="checker__button">
                    Check
                </button>
                {isLoading ? (
                    <div className="checker__result checker__result--loading">Loading...</div>
                ) : (
                    <div className={`checker__result checker__result--${status.severity}`}>
                        {status.text}
                    </div>
                )}
            </div>

            <div className="credits">By 0xSwego</div>
        </div>
    );
};
