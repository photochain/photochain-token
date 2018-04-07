import { BigNumber } from 'bignumber.js';
import { assert } from 'chai';
import { AnyNumber } from 'web3';

export const PHT_DECIMALS = 18;

export function assertNumberEqual(actual: AnyNumber, expect: AnyNumber, decimals: number = 0) {
    const actualNum = new BigNumber(actual);
    const expectNum = new BigNumber(expect);

    if (!actualNum.eq(expectNum)) {
        const div = decimals ? Math.pow(10, decimals) : 1;
        assert.fail(
            actualNum.toFixed(),
            expectNum.toFixed(),
            `${actualNum.div(div).toFixed()} == ${expectNum.div(div).toFixed()}`,
            '=='
        );
    }
}

export function assertPhotonEqual(actual: AnyNumber, expect: AnyNumber) {
    return assertNumberEqual(actual, expect, PHT_DECIMALS);
}

export function toPhoton(num: AnyNumber) {
    return shiftNumber(num, PHT_DECIMALS);
}

export function shiftNumber(num: AnyNumber, decimals: number): BigNumber {
    const factor = new BigNumber(10).pow(decimals);
    return new BigNumber(num).multipliedBy(factor);
}
