import { BigNumber } from 'bignumber.js';
import { assert } from 'chai';
import { findLast, propEq } from 'ramda';
import { TransactionLog, TransactionResult } from 'truffle';
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
    return new BigNumber(num).mul(factor);
}

export function findLastLog(trans: TransactionResult, event: string): TransactionLog {
    return findLast(propEq('event', event))(trans.logs);
}

export async function assertReverts(func: () => void) {
    try {
        await func();
    } catch (error) {
        assertRevertError(error);
        return;
    }
    assert.fail({}, {}, 'Should have reverted');
}

export function assertRevertError(error: { message: string }) {
    if (error && error.message) {
        if (error.message.search('revert') === -1) {
            assert.fail(error, {}, 'Expected revert error, instead got: ' + error.message);
        }
    } else {
        assert.fail(error, {}, 'Expected revert error');
    }
}
