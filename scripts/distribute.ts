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

interface Statistics {
    totalNonVestingAddresses: number;
    totalTokens: BigNumber;
    totalVestingAddresses: number;
}

interface DistributionRecord {
    amount: BigNumber;
    beneficiary: Address;
    vestingDays: number;
}

async function asyncExec() {
    const distribution = await readDistribution(join(__dirname, 'phtdistribution.csv'));

    const stats: Statistics = {
        totalNonVestingAddresses: 0,
        totalTokens: new BigNumber(0),
        totalVestingAddresses: 0
    };

    try {
        await distributeNotVesting(distribution.filter(row => row.vestingDays === 0), stats);
        await distributeVesting(distribution.filter(row => row.vestingDays > 0), stats);
    } finally {
        console.log(`Total minted tokens: ${fromPht(stats.totalTokens).toFixed()} PHT`);
        console.log(`Total number of holders: ${stats.totalVestingAddresses + stats.totalNonVestingAddresses}`);
        console.log(`Total number of addressess without vesting period: ${stats.totalNonVestingAddresses}`);
        console.log(`Total number of addressess under vesting period: ${stats.totalVestingAddresses}`);
    }
}

async function readDistribution(path: string) {
    const distribution: DistributionRecord[] = [];

    return new Promise<DistributionRecord[]>((resolve, reject) => {
        createReadStream(path)
            .pipe(parse({ delimiter: ',', from: 2 }))
            .on('data', row => {
                const beneficiary = row[0];
                const amount = toPht(row[1]);
                const vestingDays = Number(row[2]);
                distribution.push({ beneficiary, amount, vestingDays });
            })
            .on('end', async () => {
                resolve(distribution);
            })
            .on('error', reject);
    });
}

async function distributeNotVesting(data: DistributionRecord[], stats: Statistics) {
    const token = await PhotochainToken.deployed();
    const owner = await token.owner();
    const aggr = new TransactionAggregator(token, owner);

    for (const row of data) {
        await aggr.queue(row.beneficiary, row.amount);

        stats.totalNonVestingAddresses++;
        stats.totalTokens = stats.totalTokens.add(row.amount);
    }
    await aggr.finalize();
}

async function distributeVesting(data: DistributionRecord[], stats: Statistics) {
    const token = await PhotochainToken.deployed();
    const owner = await token.owner();

    for (const row of data) {
        console.log(`Address ${row.beneficiary} under vesting period of ${row.vestingDays} days`);

        const releaseTime = calculateTimestampFromDays(row.vestingDays);
        const vesting = await PhotochainVesting.new(token.address, row.beneficiary, releaseTime, { from: owner });

        console.log(
            `Deployed vesting contract at ${vesting.address} for ` +
                `address ${row.beneficiary} until ${new Date(releaseTime * 1000)}`
        );

        const tx = await token.mint(vesting.address, row.amount, { from: owner });
        console.log(
            `Minted ${fromPht(row.amount).toFixed()} PHT for ${vesting.address}: ${tx.receipt.transactionHash}\n`
        );

        stats.totalVestingAddresses++;
        stats.totalTokens = stats.totalTokens.add(row.amount);
    }
}

class TransactionAggregator {
    private static readonly MAX = 168;

    private addresses: Address[] = [];
    private amounts: BigNumber[] = [];

    constructor(private token: PhotochainToken, private owner: string) {}

    public async queue(beneficiary: Address, amount: BigNumber) {
        console.log(`Queuing minting of ${fromPht(amount).toFixed()} PHT for ${beneficiary}`);

        this.addresses.push(beneficiary);
        this.amounts.push(amount);

        if (this.addresses.length >= TransactionAggregator.MAX) {
            await this.mintAggregated();
        }
    }

    public async finalize() {
        if (this.addresses.length > 0) {
            await this.mintAggregated();
        }
    }

    private async mintAggregated() {
        const aggregatedAmount = this.amounts.reduce((a: BigNumber, b: BigNumber) => a.add(b), new BigNumber(0));
        console.log(
            `Sending minting transaction for ${this.addresses.length} addresses ` +
                `of total ${fromPht(aggregatedAmount).toFixed()} PHT`
        );

        const tx = await this.token.mintMany(this.addresses, this.amounts, { from: this.owner });

        console.log(`Minted ${fromPht(aggregatedAmount).toFixed()} PHT: ${tx.receipt.transactionHash}`);

        this.addresses = [];
        this.amounts = [];
    }
}

function exec(finalize: ScriptFinalizer) {
    asyncExec().then(() => finalize(), reason => finalize(reason));
}

export = exec;
