// tslint:disable:no-console

import { BigNumber } from 'bignumber.js';
import * as parse from 'csv-parse';
import { createReadStream } from 'fs';
import { join } from 'path';

import * as Web3 from 'web3';

import { PhotochainArtifacts, PhotochainToken, PhotochainVesting } from 'photochain';
import { ScriptFinalizer } from 'truffle';

import { fromPht, toPht } from '../test/helpers';

declare const artifacts: PhotochainArtifacts;
declare const web3: Web3;

const PhotochainToken = artifacts.require('./contracts/PhotochainToken.sol');
const PhotochainVesting = artifacts.require('./contracts/PhotochainVesting.sol');

interface DistributionRecord {
    amount: BigNumber;
    beneficiary: Address;
    vestingDays: number;
}

type VestingMap = { [key: string]: Address };

async function asyncExec() {
    const token = await PhotochainToken.deployed();
    const vestingMap = await readVestingMap(join(__dirname, 'phtvesting.csv'));
    const distribution = normalizeDistribution(await readDistribution(join(__dirname, 'phtdistribution.csv')));

    for (const row of distribution) {
        if (row.vestingDays === 0) {
            const balance = await token.balanceOf(row.beneficiary);
            if (!balance.equals(row.amount)) {
                console.error(
                    `Address ${row.beneficiary} has ${fromPht(balance).toFixed()} PHT instead of ${fromPht(
                        row.amount
                    ).toFixed()}`
                );
            }
        } else {
            const vesting = await PhotochainVesting.at(vestingMap[row.beneficiary]);
            const beneficiary = await vesting.beneficiary();

            if (beneficiary.toLowerCase() !== row.beneficiary.toLowerCase()) {
                console.error(`Vesting beneficiary mismatch, expected ${row.beneficiary} but got ${beneficiary}`);
            }

            const balance = await token.balanceOf(vesting.address);
            if (!balance.equals(row.amount)) {
                console.error(
                    `Vesting address ${vesting.address} holding tokens of ${beneficiary} has ${fromPht(
                        balance
                    ).toFixed()} PHT instead of ${fromPht(row.amount).toFixed()}`
                );
            }
        }
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

function normalizeDistribution(distribution: DistributionRecord[]) {
    const normalized: DistributionRecord[] = [];

    const aggr: { [key: string]: BigNumber } = {};
    for (const row of distribution) {
        if (row.vestingDays === 0) {
            if (aggr[row.beneficiary]) {
                aggr[row.beneficiary] = aggr[row.beneficiary].add(row.amount);
            } else {
                aggr[row.beneficiary] = row.amount;
            }
        } else {
            normalized.push(row);
        }
    }

    for (const beneficiary of Object.keys(aggr)) {
        normalized.push({
            amount: aggr[beneficiary],
            beneficiary,
            vestingDays: 0
        });
    }

    return normalized;
}

async function readVestingMap(path: string) {
    const map: VestingMap = {};
    return new Promise<VestingMap>((resolve, reject) => {
        createReadStream(path)
            .pipe(parse({ delimiter: ',', from: 2 }))
            .on('data', row => {
                const vestingContract = row[0];
                const beneficiary = row[1];
                map[beneficiary] = vestingContract;
            })
            .on('end', () => {
                resolve(map);
            })
            .on('error', reject);
    });
}

function exec(finalize: ScriptFinalizer) {
    asyncExec().then(() => finalize(), reason => finalize(reason));
}

export = exec;
