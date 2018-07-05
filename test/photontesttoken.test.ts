import { assert } from 'chai';
import { MintEvent, MintFinishedEvent, PhotonArtifacts, PhotonTestToken, TransferEvent } from 'photon';
import { ContractContextDefinition } from 'truffle';
import * as Web3 from 'web3';

import { assertNumberEqual, assertPhotonEqual, assertReverts, findLastLog, PHT_DECIMALS, toPhoton } from './helpers';

declare const web3: Web3;
declare const artifacts: PhotonArtifacts;
declare const contract: ContractContextDefinition;

const PhotonTestToken = artifacts.require('./PhotonTestToken.sol');

contract('PhotonTestToken', accounts => {
    const owner = accounts[0];
    const nonOwner = accounts[2];

    describe('Constructor', () => {
        let token: PhotonTestToken;

        beforeEach(async () => {
            token = await PhotonTestToken.deployed();
        });

        it('should set name', async () => {
            assert.equal(await token.name(), 'PhotonTestToken');
        });

        it('should set symbol', async () => {
            assert.equal(await token.symbol(), 'PHTT');
        });

        it('should set decimals', async () => {
            assertNumberEqual(await token.decimals(), PHT_DECIMALS);
        });

        it('should start with zero totalSupply', async () => {
            assertPhotonEqual(await token.totalSupply(), 0);
        });

        it('should set owner', async () => {
            assert.equal(await token.owner(), accounts[0]);
        });

        it('should set maximumSupply', async () => {
            assertPhotonEqual(await token.maximumSupply(), toPhoton(1_000_000_000_000));
        });

        it('should be minting', async () => {
            assert.isFalse(await token.mintingFinished());
        });
    });

    describe('Function mint', () => {
        const beneficiary = accounts[1];
        const amount = toPhoton(100);
        let token: PhotonTestToken;

        beforeEach(async () => {
            token = await PhotonTestToken.new();
        });

        it('should increase totalSupply', async () => {
            const prevSupply = await token.totalSupply();
            await token.mint(beneficiary, amount);

            assertPhotonEqual(await token.totalSupply(), prevSupply.add(amount));
        });

        it('should increase balance', async () => {
            const prevBalance = await token.balanceOf(beneficiary);
            await token.mint(beneficiary, amount);

            assertPhotonEqual(await token.balanceOf(beneficiary), prevBalance.add(amount));
        });

        it('should emit Mint event', async () => {
            const tx = await token.mint(beneficiary, amount);

            const log = findLastLog(tx, 'Mint');
            assert.isOk(log);

            const event = log.args as MintEvent;
            assert.isOk(event);
            assert.equal(event.to, beneficiary);
            assertPhotonEqual(event.amount, amount);
        });

        it('should emit Transfer event', async () => {
            const tx = await token.mint(beneficiary, amount);

            const log = findLastLog(tx, 'Transfer');
            assert.isOk(log);

            const event = log.args as TransferEvent;
            assert.isOk(event);
            assert.equal(event.from, '0x' + '0'.repeat(40));
            assert.equal(event.to, beneficiary);
            assertPhotonEqual(event.value, amount);
        });

        it('should revert when minting is finished', async () => {
            await token.finishMinting();

            await assertReverts(async () => {
                await token.mint(beneficiary, amount);
            });
        });

        it('should revert when called by non-owner', async () => {
            await assertReverts(async () => {
                await token.mint(beneficiary, amount, {
                    from: nonOwner
                });
            });
        });

        it('should revert when exceeds maximumSupply', async () => {
            const maximumSupply = await token.maximumSupply();

            await assertReverts(async () => {
                await token.mint(beneficiary, maximumSupply.add(1));
            });
        });
    });

    describe('Function finishMinting', () => {
        let token: PhotonTestToken;

        beforeEach(async () => {
            token = await PhotonTestToken.new();
        });

        it('should set mintingFinished', async () => {
            assert.isFalse(await token.mintingFinished());
            await token.finishMinting();
            assert.isTrue(await token.mintingFinished());
        });

        it('should emit MintFinished event', async () => {
            const tx = await token.finishMinting();

            const log = findLastLog(tx, 'MintFinished');
            assert.isOk(log);

            const event = log.args as MintFinishedEvent;
            assert.isOk(event);
        });

        it('should revert when called by non-owner', async () => {
            await assertReverts(async () => {
                await token.finishMinting({ from: nonOwner });
            });
        });

        it('should revert when called after minting is finished', async () => {
            await token.finishMinting();

            await assertReverts(async () => {
                await token.finishMinting();
            });
        });
    });
});
