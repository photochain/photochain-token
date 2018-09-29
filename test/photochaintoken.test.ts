import { BigNumber } from 'bignumber.js';
import { assert } from 'chai';
import {
    ApprovalEvent,
    MintEvent,
    MintFinishedEvent,
    PhotochainArtifacts,
    PhotochainToken,
    TransferEvent
} from 'photochain';
import { ContractContextDefinition } from 'truffle';
import * as Web3 from 'web3';

import {
    assertNumberEqual,
    assertPhtEqual,
    assertReverts,
    findLastLog,
    PHT_DECIMALS,
    toPht,
    ZERO_ADDRESS
} from './helpers';

declare const web3: Web3;
declare const artifacts: PhotochainArtifacts;
declare const contract: ContractContextDefinition;

const PhotochainToken = artifacts.require('./PhotochainToken.sol');

contract('PhotochainToken', accounts => {
    const owner = accounts[0];
    const nonOwner = accounts[9];
    const defaultAmount = toPht(100);

    let token: PhotochainToken;

    beforeEach(async () => {
        token = await PhotochainToken.new();
    });

    describe('Constructor', () => {
        it('should set name', async () => {
            assert.equal(await token.name(), 'PhotochainToken');
        });

        it('should set symbol', async () => {
            assert.equal(await token.symbol(), 'PHT');
        });

        it('should set decimals', async () => {
            assertNumberEqual(await token.decimals(), PHT_DECIMALS);
        });

        it('should start with zero totalSupply', async () => {
            assertPhtEqual(await token.totalSupply(), 0);
        });

        it('should set owner', async () => {
            assert.equal(await token.owner(), accounts[0]);
        });

        it('should set cap', async () => {
            assertPhtEqual(await token.cap(), toPht(120_000_000));
        });

        it('should be minting', async () => {
            assert.isFalse(await token.mintingFinished());
        });
    });

    describe('Function transfer', () => {
        const defaultRecipient = accounts[1];

        it('should transfer requested amount', async () => {
            await token.mint(owner, defaultAmount);

            const prevOwnerBalance = await token.balanceOf(owner);
            const prevRecipientBalance = await token.balanceOf(defaultRecipient);

            await token.transfer(defaultRecipient, defaultAmount);

            const ownerBalance = await token.balanceOf(owner);
            const recipientBalance = await token.balanceOf(defaultRecipient);

            assertPhtEqual(ownerBalance, prevOwnerBalance.sub(defaultAmount));
            assertPhtEqual(recipientBalance, prevRecipientBalance.add(defaultAmount));
        });

        it('should emit Transfer event', async () => {
            await token.mint(owner, defaultAmount);

            const tx = await token.transfer(defaultRecipient, defaultAmount);

            const log = findLastLog(tx, 'Transfer');
            assert.isOk(log);

            const event = log.args as TransferEvent;
            assert.isOk(event);
            assert.equal(event.from, owner);
            assert.equal(event.to, defaultRecipient);
            assertPhtEqual(event.value, defaultAmount);
        });

        it('should revert when recipient is zero address', async () => {
            await token.mint(owner, defaultAmount);
            await assertReverts(async () => {
                await token.transfer(ZERO_ADDRESS, defaultAmount);
            });
        });

        it('should revert when sender has not enough balance', async () => {
            const tooMuch = (await token.balanceOf(owner)).add(1);
            await assertReverts(async () => {
                await token.transfer(defaultRecipient, tooMuch);
            });
        });
    });

    describe('Function approve', () => {
        const defaultSpender = accounts[1];

        it('should set allowance', async () => {
            await token.approve(defaultSpender, defaultAmount);
            assertPhtEqual(await token.allowance(owner, defaultSpender), defaultAmount);
        });

        it('should override previous allowance', async () => {
            await token.approve(defaultSpender, defaultAmount);
            await token.approve(defaultSpender, defaultAmount.mul(3));
            assertPhtEqual(await token.allowance(owner, defaultSpender), defaultAmount.mul(3));
        });

        it('should emit Approval event', async () => {
            const tx = await token.approve(defaultSpender, defaultAmount);

            const log = findLastLog(tx, 'Approval');
            assert.isOk(log);

            const event = log.args as ApprovalEvent;
            assert.isOk(event);
            assert.equal(event.owner, owner);
            assert.equal(event.spender, defaultSpender);
            assertPhtEqual(event.value, defaultAmount);
        });

        it('should revert when spender is zero address', async () => {
            await token.mint(owner, defaultAmount);
            await assertReverts(async () => {
                await token.transfer(ZERO_ADDRESS, defaultAmount);
            });
        });
    });

    describe('Function transferFrom', () => {
        const defaultSpender = accounts[1];
        const defaultRecipient = accounts[2];

        it('should transfer the requested amount', async () => {
            await token.mint(owner, defaultAmount);
            await token.approve(defaultSpender, defaultAmount);

            const prevOwnerBalance = await token.balanceOf(owner);
            const prevRecipientBalance = await token.balanceOf(defaultRecipient);

            await token.transferFrom(owner, defaultRecipient, defaultAmount, { from: defaultSpender });

            const ownerBalance = await token.balanceOf(owner);
            const recipientBalance = await token.balanceOf(defaultRecipient);

            assertPhtEqual(await token.balanceOf(owner), prevOwnerBalance.sub(defaultAmount));
            assertPhtEqual(await token.balanceOf(defaultRecipient), prevRecipientBalance.add(defaultAmount));
        });

        it('should decrease the spender allowance', async () => {
            await token.mint(owner, defaultAmount);
            await token.approve(defaultSpender, defaultAmount.mul(2));

            const prevAllowance = await token.allowance(owner, defaultSpender);

            await token.transferFrom(owner, defaultRecipient, defaultAmount, { from: defaultSpender });

            assertPhtEqual(await token.allowance(owner, defaultSpender), prevAllowance.sub(defaultAmount));
        });

        it('should emit Transfer event', async () => {
            await token.mint(owner, defaultAmount);
            await token.approve(defaultSpender, defaultAmount);

            const tx = await token.transferFrom(owner, defaultRecipient, defaultAmount, { from: defaultSpender });

            const log = findLastLog(tx, 'Transfer');
            assert.isOk(log);

            const event = log.args as TransferEvent;
            assert.isOk(event);
            assert.equal(event.from, owner);
            assert.equal(event.to, defaultRecipient);
            assertPhtEqual(event.value, defaultAmount);
        });

        it('should revert when owner does not have enough balance', async () => {
            await token.mint(owner, defaultAmount);

            const ownerBalance = await token.balanceOf(owner);
            const tooMuch = ownerBalance.add(1);
            await token.approve(defaultSpender, tooMuch);

            await assertReverts(async () => {
                await token.transferFrom(owner, defaultRecipient, tooMuch, { from: defaultSpender });
            });
        });

        it('should revert when spender does not have enough allowance', async () => {
            await token.mint(owner, defaultAmount.mul(3));
            await token.approve(defaultSpender, defaultAmount);

            const tooMuch = (await token.allowance(owner, defaultSpender)).add(1);

            await assertReverts(async () => {
                await token.transferFrom(owner, defaultRecipient, tooMuch, { from: defaultSpender });
            });
        });

        it('should revert when recipient is zero address', async () => {
            await token.mint(owner, defaultAmount);
            await token.approve(defaultSpender, defaultAmount);

            await assertReverts(async () => {
                await token.transferFrom(owner, ZERO_ADDRESS, defaultAmount, { from: defaultSpender });
            });
        });
    });

    describe('Function decreaseAllowance', () => {
        const defaultSpender = accounts[1];

        it('should decrease the spender allowance', async () => {
            await token.approve(defaultSpender, defaultAmount);
            await token.decreaseAllowance(defaultSpender, 1);

            assertPhtEqual(await token.allowance(owner, defaultSpender), defaultAmount.sub(1));
        });

        it('should decrease the spender allowance to zero', async () => {
            await token.approve(defaultSpender, defaultAmount);
            await token.decreaseAllowance(defaultSpender, defaultAmount);

            assertPhtEqual(await token.allowance(owner, defaultSpender), 0);
        });

        it('should emit Approval event', async () => {
            await token.approve(defaultSpender, defaultAmount);
            const tx = await token.decreaseAllowance(defaultSpender, 1);

            const log = findLastLog(tx, 'Approval');
            assert.isOk(log);

            const event = log.args as ApprovalEvent;
            assert.isOk(event);
            assert.equal(event.owner, owner);
            assert.equal(event.spender, defaultSpender);
            assertPhtEqual(event.value, defaultAmount.sub(1));
        });

        it('should revert when subtracted value is larger than allowance', async () => {
            await token.approve(defaultSpender, defaultAmount);

            await assertReverts(async () => {
                await token.decreaseAllowance(defaultSpender, defaultAmount.mul(2));
            });
        });

        it('should revert when allowance is zero', async () => {
            await assertReverts(async () => {
                await token.decreaseAllowance(defaultSpender, 1);
            });
        });

        it('should revert spender is zero address', async () => {
            await assertReverts(async () => {
                await token.decreaseAllowance(ZERO_ADDRESS, 1);
            });
        });
    });

    describe('Function increaseAllowance', () => {
        const defaultSpender = accounts[1];

        it('should increase the spender allowance', async () => {
            await token.approve(defaultSpender, defaultAmount);
            await token.increaseAllowance(defaultSpender, 1);

            assertPhtEqual(await token.allowance(owner, defaultSpender), defaultAmount.add(1));
        });

        it('should increase the spender allowance from zero', async () => {
            await token.increaseAllowance(defaultSpender, defaultAmount);

            assertPhtEqual(await token.allowance(owner, defaultSpender), defaultAmount);
        });

        it('should emit Approval event', async () => {
            await token.approve(defaultSpender, defaultAmount);
            const tx = await token.increaseAllowance(defaultSpender, 1);

            const log = findLastLog(tx, 'Approval');
            assert.isOk(log);

            const event = log.args as ApprovalEvent;
            assert.isOk(event);
            assert.equal(event.owner, owner);
            assert.equal(event.spender, defaultSpender);
            assertPhtEqual(event.value, defaultAmount.add(1));
        });

        it('should revert spender is zero address', async () => {
            await assertReverts(async () => {
                await token.increaseAllowance(ZERO_ADDRESS, 1);
            });
        });
    });

    describe('Function mint', () => {
        const defaultBeneficiary = accounts[1];

        it('should increase totalSupply', async () => {
            const prevSupply = await token.totalSupply();
            await token.mint(defaultBeneficiary, defaultAmount);

            assertPhtEqual(await token.totalSupply(), prevSupply.add(defaultAmount));
        });

        it('should increase balance', async () => {
            const prevBalance = await token.balanceOf(defaultBeneficiary);
            await token.mint(defaultBeneficiary, defaultAmount);

            assertPhtEqual(await token.balanceOf(defaultBeneficiary), prevBalance.add(defaultAmount));
        });

        it('should emit Mint event', async () => {
            const tx = await token.mint(defaultBeneficiary, defaultAmount);

            const log = findLastLog(tx, 'Mint');
            assert.isOk(log);

            const event = log.args as MintEvent;
            assert.isOk(event);
            assert.equal(event.to, defaultBeneficiary);
            assertPhtEqual(event.amount, defaultAmount);
        });

        it('should emit Transfer event', async () => {
            const tx = await token.mint(defaultBeneficiary, defaultAmount);

            const log = findLastLog(tx, 'Transfer');
            assert.isOk(log);

            const event = log.args as TransferEvent;
            assert.isOk(event);
            assert.equal(event.from, '0x' + '0'.repeat(40));
            assert.equal(event.to, defaultBeneficiary);
            assertPhtEqual(event.value, defaultAmount);
        });

        it('should revert when minting is finished', async () => {
            await token.finishMinting();

            await assertReverts(async () => {
                await token.mint(defaultBeneficiary, defaultAmount);
            });
        });

        it('should revert when called by non-owner', async () => {
            await assertReverts(async () => {
                await token.mint(defaultBeneficiary, defaultAmount, {
                    from: nonOwner
                });
            });
        });

        it('should revert when exceeds cap', async () => {
            const cap = await token.cap();

            await assertReverts(async () => {
                await token.mint(defaultBeneficiary, cap.add(1));
            });
        });
    });

    describe('Function mintMany', () => {
        const defaultBeneficiaries = accounts.slice(1, 5);
        const defaultAmounts = [toPht(100), toPht(150), toPht(50), toPht(200)];
        const defaultTotalAmount = defaultAmounts.reduce((a: BigNumber, b: BigNumber) => a.add(b), new BigNumber(0));

        it('should increase totalSupply', async () => {
            const prevSupply = await token.totalSupply();
            await token.mintMany(defaultBeneficiaries, defaultAmounts);

            assertPhtEqual(await token.totalSupply(), prevSupply.add(defaultTotalAmount));
        });

        it('should increase balances', async () => {
            const prevBalances = await Promise.all(defaultBeneficiaries.map(a => token.balanceOf(a)));
            await token.mintMany(defaultBeneficiaries, defaultAmounts);

            for (let i = 0; i < defaultBeneficiaries.length; i++) {
                const beneficiary = defaultBeneficiaries[i];
                const prevBalance = prevBalances[i];
                const amount = defaultAmounts[i];

                assertPhtEqual(await token.balanceOf(beneficiary), prevBalance.add(amount));
            }
        });

        it('should emit Mint events', async () => {
            const tx = await token.mintMany(defaultBeneficiaries, defaultAmounts);
            const logs = tx.logs.filter(log => log.event === 'Mint');

            assert.lengthOf(logs, defaultBeneficiaries.length);

            for (let i = 0; i < defaultBeneficiaries.length; i++) {
                const event = logs[i].args as MintEvent;
                assert.equal(event.to, defaultBeneficiaries[i]);
                assertPhtEqual(event.amount, defaultAmounts[i]);
            }
        });

        it('should emit Transfer events', async () => {
            const tx = await token.mintMany(defaultBeneficiaries, defaultAmounts);
            const logs = tx.logs.filter(log => log.event === 'Transfer');

            assert.lengthOf(logs, defaultBeneficiaries.length);

            for (let i = 0; i < defaultBeneficiaries.length; i++) {
                const event = logs[i].args as TransferEvent;
                assert.equal(event.from, '0x' + '0'.repeat(40));
                assert.equal(event.to, defaultBeneficiaries[i]);
                assertPhtEqual(event.value, defaultAmounts[i]);
            }
        });

        const maxMintMany = 168;
        it(`should accept ${maxMintMany} beneficiaries at once and keep gas usage under 5.3 mln`, async () => {
            const prevSupply = await token.totalSupply();

            const beneficiaries = [];
            const amounts = [];
            for (let i = 1; i <= maxMintMany; i++) {
                beneficiaries.push(
                    `0x${'0'
                        .repeat(40)
                        .concat(i.toString())
                        .slice(-40)}`
                );
                amounts.push(defaultAmount);
            }
            const totalAmount = amounts.reduce((a: BigNumber, b: BigNumber) => a.add(b), new BigNumber(0));

            const tx = await token.mintMany(beneficiaries, amounts);

            assert.isBelow(tx.receipt.gasUsed, 5_300_000);

            // check total supply change to confirm the transaction has succeeded
            assertPhtEqual(await token.totalSupply(), prevSupply.add(totalAmount));
        });

        it('should revert when minting is finished', async () => {
            await token.finishMinting();

            await assertReverts(async () => {
                await token.mintMany(defaultBeneficiaries, defaultAmounts);
            });
        });

        it('should revert when called by non-owner', async () => {
            await assertReverts(async () => {
                await token.mintMany(defaultBeneficiaries, defaultAmounts, {
                    from: nonOwner
                });
            });
        });

        it('should revert when exceeds cap', async () => {
            const cap = await token.cap();
            const exceedingAmounts = [cap.div(2), cap.div(2).add(1)];
            const exceedingBeneficiaries = accounts.slice(0, 2);

            await assertReverts(async () => {
                await token.mintMany(exceedingBeneficiaries, exceedingAmounts);
            });
        });
    });

    describe('Function finishMinting', () => {
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
