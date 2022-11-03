import { BigNumber } from "ethers";

/**
 * Converts a big number to a float
 * @param amount The BigNumber to convert
 * @param outputDecimals The number of decimals desired in the output value
 * @param inputDecimals The number of decimals in the input value (default: 18)
 */
export const bigNumberToFloat = (
    amount: BigNumber,
    outputDecimals: number = 4,
    inputDecimals: number = 18,
): number => {
    // used for integer division
    const firstDivisor = BigNumber.from(10).pow(inputDecimals - outputDecimals);

    // used for float division (so to maintain some fractional digits)
    const secondDivisor = BigNumber.from(10).pow(outputDecimals).toNumber();

    return amount.div(firstDivisor).toNumber() / secondDivisor;
};
