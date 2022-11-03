export enum Severity {
    Unknown,
    Healthy,
    Warning,
    Danger
}

export interface IStatus {
    severity: Severity;
    text?: string;
}

export const CheckOptimismBridgeStatus = (): Promise<IStatus> => {
    return Promise.resolve({
        severity: Severity.Healthy,
        text: "Ok"
    });
};
