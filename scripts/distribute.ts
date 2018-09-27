// tslint:disable:no-console

import { BigNumber } from 'bignumber.js';
import * as parse from 'csv-parse';
import { createReadStream } from 'fs';
import { join } from 'path';

import * as Web3 from 'web3';

import { PhotochainArtifacts, PhotochainToken } from 'photochain';
import { ScriptFinalizer, TransactionResult } from 'truffle';

import { calculateTimestampFromDays, fromPht, toPht } from '../test/helpers';

declare const artifacts: PhotochainArtifacts;
declare const web3: Web3;

const PhotochainToken = artifacts.require('./contracts/PhotochainToken.sol');
const PhotochainVesting = artifacts.require('./contracts/PhotochainVesting.sol');

interface DataRow {
    beneficiary: Address;
    amount: BigNumber;
    vestingDays: number;
}

async function asyncExec() {
    const data: DataRow[] = [];
    const path = join(__dirname, 'phtdistribution.csv');

    console.log(`Reading data from ${path}`);

    await createReadStream(path)
        .pipe(parse({ delimiter: ',', from: 2 }))
        .on('data', row => {
            const beneficiary = row[0];
            const amount = toPht(row[1]);
            const vestingDays = Number(row[2]);
            data.push({ beneficiary, amount, vestingDays });
        })
        .on('end', async () => {
            await distribute(data);
        });
}

function exec(finalize: ScriptFinalizer) {
    asyncExec().then(() => finalize(), reason => finalize(reason));
}

async function distribute(data: DataRow[]) {
    const token = await PhotochainToken.deployed();
    const owner = await token.owner();
    const aggr = new TransactionAggregator(token, owner);

    for (const row of data) {
        if (row.vestingDays > 0) {
            console.log(`Address ${row.beneficiary} under vesting period of ${row.vestingDays} days`);

            const vesting = await deployVestingContract(token, row.beneficiary, row.vestingDays);
            aggr.queue(vesting.address, row.amount);
        } else {
            aggr.queue(row.beneficiary, row.amount);
        }
    }

    const results = await aggr.finalize();
    console.log('Finished with mintMany transactions:\n' + results.map(tx => tx.receipt.transactionHash).join('\n'));
}

async function deployVestingContract(token: PhotochainToken, beneficiary: Address, vestingDays: number) {
    const releaseTime = calculateTimestampFromDays(vestingDays);
    const vesting = await PhotochainVesting.new(token.address, beneficiary, releaseTime);
    console.log(
        `Deployed vesting contract at ${vesting.address} for ` +
            `address ${beneficiary} until ${new Date(releaseTime * 1000)}`
    );
    return vesting;
}

class TransactionAggregator {
    private static readonly MAX_MINT_MANY = 200;

    private txs: Array<Promise<TransactionResult>> = [];
    private addresses: Address[] = [];
    private amounts: BigNumber[] = [];
    private totalAddresses = 0;
    private totalAmount = new BigNumber(0);

    constructor(private token: PhotochainToken, private owner: string) {}

    public queue(beneficiary: Address, amount: BigNumber) {
        console.log(`Queuing minting of ${fromPht(amount).toFixed()} PHT for ${beneficiary}`);

        this.addresses.push(beneficiary);
        this.amounts.push(amount);

        if (this.addresses.length >= TransactionAggregator.MAX_MINT_MANY) {
            this.mintAggregated();
        }
    }

    public finalize() {
        if (this.addresses.length > 0) {
            this.mintAggregated();
        }

        console.log(
            `Finalizing distribution of ${fromPht(this.totalAmount).toFixed()} PHT ` +
                `to ${this.totalAddresses} addresses`
        );
        console.log(`Waiting for ${this.txs.length} transactions...`);
        return Promise.all(this.txs);
    }

    private mintAggregated() {
        const aggregatedAmount = this.amounts.reduce((a: BigNumber, b: BigNumber) => a.add(b), new BigNumber(0));
        console.log(
            `Sending minting transaction for ${this.addresses.length} addresses ` +
                `of total ${fromPht(aggregatedAmount).toFixed()} PHT`
        );

        this.txs.push(this.token.mintMany(this.addresses, this.amounts, { from: this.owner }));

        this.totalAddresses += this.addresses.length;
        this.addresses = [];

        this.totalAmount = this.totalAmount.add(aggregatedAmount);
        this.amounts = [];
    }
}

export = exec;
