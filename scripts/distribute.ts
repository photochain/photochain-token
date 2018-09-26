// tslint:disable:no-console

import { BigNumber } from 'bignumber.js';
import * as parse from 'csv-parse';
import { createReadStream } from 'fs';
import { join } from 'path';

import * as Web3 from 'web3';

import { PhotochainArtifacts, PhotochainToken } from 'photochain';
import { ScriptFinalizer, TransactionResult } from 'truffle';

import { fromPht, toPht } from '../test/helpers';

declare const artifacts: PhotochainArtifacts;
declare const web3: Web3;

const PhotochainTokenContract = artifacts.require('./contracts/PhotochainToken.sol');

async function asyncExec() {
    const token = await PhotochainTokenContract.deployed();
    const owner = await token.owner();
    const aggr = new TransactionAggregator(token, owner);

    await createReadStream(join(__dirname, 'phtdistribution.csv'))
        .pipe(parse({delimiter: ',', from: 2}))
        .on('data', async row => {
            const address = row[0];
            const amount = toPht(row[1]);
            const vestingDays = row[2];

            aggr.queue(address, amount, Number(vestingDays));
        })
        .on('end', async () => {
            const results = await aggr.finalize();

            console.log('Finished!', results);
        });
}

function exec(finalize: ScriptFinalizer) {
    asyncExec().then(() => finalize(), reason => finalize(reason));
}

class TransactionAggregator {
    private static readonly MAX_MINT_MANY = 200;

    private txs: Array<Promise<TransactionResult>> = [];
    private addresses: string[] = [];
    private amounts: BigNumber[] = [];

    constructor(private token: PhotochainToken, private owner: string) {}

    public queue(address: string, amount: BigNumber, vestingDays: number) {
        let holder = address;
        if (vestingDays > 0) {
            console.log(`Address ${address} under vesting period of ${vestingDays} days`);
            holder = 'TODO-VESTING-CONTRACT'; // TODO: vesting contract
            return;
        }
        console.log(`Queuing minting of ${fromPht(amount).toFixed()} PHT for ${holder}`);

        this.addresses.push(address);
        this.amounts.push(amount);

        if (this.addresses.length >= TransactionAggregator.MAX_MINT_MANY) {
            this.mintAggregated();
        }
    }

    public finalize() {
        if (this.addresses.length > 0) {
            this.mintAggregated();
        }

        console.log(`Waiting for ${this.txs.length} transactions...`);
        return Promise.all(this.txs);
    }

    private mintAggregated() {
        const totalAmount = this.amounts.reduce((a: BigNumber, b: BigNumber) => a.add(b), new BigNumber(0));
        console.log(`Sending minting transaction for ${this.addresses.length} addresses ` +
                    `of total ${fromPht(totalAmount).toFixed()} PHT`);

        this.txs.push(this.token.mintMany(this.addresses, this.amounts, { from: this.owner }));

        this.addresses = [];
        this.amounts = [];
    }
}

export = exec;
