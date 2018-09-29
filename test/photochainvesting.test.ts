import { assert } from 'chai';
import { PhotochainArtifacts, PhotochainToken, PhotochainVesting } from 'photochain';
import { ContractContextDefinition } from 'truffle';
import * as Web3 from 'web3';

import { assertNumberEqual, assertReverts, calculateTimestampFromDays, fastForward, toPht } from './helpers';

declare const web3: Web3;
declare const artifacts: PhotochainArtifacts;
declare const contract: ContractContextDefinition;

const PhotochainToken = artifacts.require('./PhotochainToken.sol');
const PhotochainVesting = artifacts.require('./PhotochainVesting.sol');

contract('PhotochainVesting', accounts => {
    const defaultBeneficiary = accounts[2];
    const defaultReleaseTime = calculateTimestampFromDays(90);

    describe('Constructor', () => {
        let token: PhotochainToken;

        beforeEach(async () => {
            token = await PhotochainToken.deployed();
        });

        it('should set token', async () => {
            const vesting = await PhotochainVesting.new(token.address, defaultBeneficiary, defaultReleaseTime);
            assert.equal(await vesting.token(), token.address);
        });

        it('should set beneficiary', async () => {
            const vesting = await PhotochainVesting.new(token.address, defaultBeneficiary, defaultReleaseTime);
            assert.equal(await vesting.beneficiary(), defaultBeneficiary);
        });

        it('should set release time to 90 days', async () => {
            const vesting = await PhotochainVesting.new(token.address, defaultBeneficiary, defaultReleaseTime);
            assertNumberEqual(await vesting.releaseTime(), defaultReleaseTime);
        });

        it('should set release time to 365 days', async () => {
            const releaseTime = calculateTimestampFromDays(365);
            const vesting = await PhotochainVesting.new(token.address, defaultBeneficiary, releaseTime);
            assertNumberEqual(await vesting.releaseTime(), releaseTime);
        });

        it('should revert when release time in the past', async () => {
            const releaseTime = calculateTimestampFromDays(0);

            await assertReverts(async () => {
                await PhotochainVesting.new(token.address, defaultBeneficiary, releaseTime);
            });
        });

        it('should revert when release time too far into future', async () => {
            const releaseTime = calculateTimestampFromDays(3650);

            await assertReverts(async () => {
                await PhotochainVesting.new(token.address, defaultBeneficiary, releaseTime);
            });
        });
    });

    describe('Function release', () => {
        let token: PhotochainToken;
        let vesting: PhotochainVesting;

        beforeEach(async () => {
            token = await PhotochainToken.deployed();
            vesting = await PhotochainVesting.new(token.address, defaultBeneficiary, defaultReleaseTime);
        });

        it('should revert when release time not passed', async () => {
            await assertReverts(async () => {
                await vesting.release();
            });
        });

        it('should release tokens when time passed', async () => {
            await token.mint(vesting.address, toPht(100));
            fastForward(web3, 91 * 24 * 60 * 60);
            await vesting.release();
        });
    });
});
