import { ethers } from "ethers";
import { checkPausedAbi } from "./proxy-abi";
import { BigNumber } from "ethers";
import { bigNumberToFloat } from "./big-number-to-float";

export enum Severity {
    Unknown = "unknown",
    Checking = "checking",
    Healthy = "healthy",
    Warning = "warning",
    Danger = "danger"
}

export interface IStatus {
    severity: Severity;
    text?: string;
}

// RPCs used to interrogate the network
const L1RpcURL = "https://eth-mainnet.g.alchemy.com/v2/zeRivFXfmVO3Y41W7J9rZLnFKL3TNl9W";
const L2RpcURL = "https://opt-mainnet.g.alchemy.com/v2/U0gn04YxfmDru7Osr1izWArixIWJaaRo";

// Addresses in ETH and Optimism chains
const L1ProxyAddress = "0x25ace71c97b33cc4729cf772ae268934f7ab5fa1";
const L1BridgeAddress = "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1";
const L2BridgeAddress = "0x4200000000000000000000000000000000000010";

const ETHBlocksInOneDay = 7156;
const OPTBlocksInOneDay = 323798;

/** Run all checks to determine the health of the bridge */
export async function* CheckOptimismBridgeStatus(): AsyncGenerator<IStatus> {
    try {
        yield { severity: Severity.Checking, text: "Checking if L1 proxy is paused..." };
        if (await CheckIfProxyIsPaused(L1RpcURL, L1ProxyAddress)) {
            yield { severity: Severity.Danger, text: "L1 Proxy is paused" };
            return;
        }

        yield { severity: Severity.Checking, text: "Retrieving flow for L1 bridge..." };
        const l1Stats = await CheckL1Flows();

        yield { severity: Severity.Checking, text: "Retrieving flow for L2 bridge..." };
        const l2Stats = await CheckL2Flows();

        if (l2Stats.deposited.gt(l1Stats.deposited)) {
            // The number of ETH withdrawn in the L2 is greater than the amount deposited in the L1
            const text = "Amount of ETH withdrawn higher than the amount deposited. Possible hack.";
            yield { severity: Severity.Danger, text };
            return;
        }

        if (l2Stats.deposited.lt(l1Stats.deposited.mul(90).div(100))) {
            // The number of ETH withdrawn in the L2 is less than 90% of the ones deposited in the L1
            const text = "L2 bridge seems to be processing the transactions in a slow way.";
            yield { severity: Severity.Warning, text };
            return;
        }

        yield { severity: Severity.Healthy, text: "Bridge healthy! All checks have passed" };
    } catch (error) {
        console.error({ error });
        yield {
            severity: Severity.Unknown,
            text: "An error occurred, check the console for more details"
        };
    }
}

/** Control whether the bridge proxy is currently paused */
const CheckIfProxyIsPaused = async (rpcUrl: string, contractAddress: string): Promise<boolean> => {
    // instantiate contract
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, checkPausedAbi, provider);

    // check whether it is paused
    const paused: boolean = await contract.paused();
    console.info({ paused });
    return paused;
};

/** Retrieve the amount of ETH sent to the L1 Bridge in the last 24 hours */
const CheckL1Flows = async (): Promise<{ deposited: BigNumber; withdrawn: BigNumber }> => {
    console.log(
        `Fetching L1 bridge deposits and withdrawals for the last day (${ETHBlocksInOneDay} blocks)`
    );
    const provider = new ethers.providers.JsonRpcProvider(L1RpcURL);

    const abi = [
        "event ETHDepositInitiated(address indexed _from,address indexed _to,uint256 _amount,bytes _data)",
        "event ETHWithdrawalFinalized(address indexed _from,address indexed _to,uint256 _amount,bytes _data)"
    ];
    let contract = new ethers.Contract(L1BridgeAddress, abi, provider);
    const fromBlock = await provider.getBlockNumber().then((b) => b - 7156);

    // fetch deposited ETH
    const depositEvents = await contract.queryFilter("ETHDepositInitiated", fromBlock);
    const deposits = depositEvents.map((e) => e.args![2] as BigNumber);
    const depositsSum = deposits.reduce((prev, curr) => prev.add(curr), BigNumber.from(0));

    // fetch deposited ETH
    const withdrawEvents = await contract.queryFilter("ETHWithdrawalFinalized", fromBlock);
    const withdrawals = withdrawEvents.map((e) => e.args![2] as BigNumber);
    const withdrawalsSum = withdrawals.reduce((prev, curr) => prev.add(curr), BigNumber.from(0));

    console.log({
        _message: "ETH stats for the last 600 blocks",
        deposits: bigNumberToFloat(depositsSum),
        withdrawals: bigNumberToFloat(withdrawalsSum)
    });
    return { deposited: depositsSum, withdrawn: withdrawalsSum };
};

/** Retrieve the amount of ETH sent to the L1 Bridge in the last 24 hours */
const CheckL2Flows = async (): Promise<{ deposited: BigNumber; withdrawn: BigNumber }> => {
    console.log(
        `Fetching L2 bridge deposits and withdrawals for the last day (${OPTBlocksInOneDay} blocks)`
    );
    const provider = new ethers.providers.JsonRpcProvider(L2RpcURL);

    const abi = [
        "event DepositFinalized(address indexed _l1Token,address indexed _l2Token,address indexed _from,address _to,uint256 _amount,bytes _data)",
        "event WithdrawalInitiated(address indexed _l1Token,address indexed _l2Token,address indexed _from,address _to,uint256 _amount,bytes _data)"
    ];
    let contract = new ethers.Contract(L2BridgeAddress, abi, provider);
    const fromBlock = await provider.getBlockNumber().then((b) => b - OPTBlocksInOneDay);

    // fetch deposited ETH
    const depositEvents = await contract.queryFilter("DepositFinalized", fromBlock);
    const deposits = depositEvents
        .filter((e) => e.args![0] === "0x0000000000000000000000000000000000000000")
        .map((e) => e.args![4] as BigNumber);
    const depositsSum = deposits.reduce((prev, curr) => prev.add(curr), BigNumber.from(0));

    // fetch deposited ETH
    const withdrawEvents = await contract.queryFilter("WithdrawalInitiated", fromBlock);
    const withdrawals = withdrawEvents
        .filter((e) => e.args![0] === "0x0000000000000000000000000000000000000000")
        .map((e) => e.args![4] as BigNumber);
    const withdrawalsSum = withdrawals.reduce((prev, curr) => prev.add(curr), BigNumber.from(0));

    console.log({
        _message: "ETH stats for the last 600 blocks",
        deposits: bigNumberToFloat(depositsSum),
        withdrawals: bigNumberToFloat(withdrawalsSum)
    });
    return { deposited: depositsSum, withdrawn: withdrawalsSum };
};
