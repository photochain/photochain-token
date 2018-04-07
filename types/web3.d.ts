declare type Callback<T> = (err: Error | null, value: T) => void;

declare type Address = string;

declare module 'web3' {
    import { BigNumber } from 'bignumber.js';

    class Web3 {
        public eth: {
            accounts: Address[];
            defaultAccount: Address;

            getBlockNumber(callback: Callback<number>): void;
            sendTransaction(txData: Web3.TxData, callback: Callback<string>): void;
            getBalance(account: Address, callback: Callback<BigNumber>): void;
            sign(account: Address, text: string): string;
            getBlock(id: number | string, callback: Callback<any>): void;
        };

        public version: {
            getNetwork(cb: Callback<string>): void;
        };

        public currentProvider: Web3.Provider;

        public constructor(provider?: Web3.Provider);

        public sha3(str: string, options?: { encoding: 'hex' }): string;
        public toDecimal(hex: string): number;

        public toHex(num: number): string;

        public isChecksumAddress(address: Address): boolean;
    }

    namespace Web3 {
        type AnyNumber = number | string | BigNumber;

        interface RequestPayload {
            params: any[];
            method: string;
            id: number;
            jsonrpc: string;
        }

        interface ResponsePayload {
            result: any;
            id: number;
            jsonrpc: string;
        }

        interface Provider {
            sendAsync(payload: RequestPayload, callback: (err: Error | null, result: ResponsePayload) => void): void;
        }

        interface TxData {
            from?: Address;
            to: Address;
            value?: AnyNumber;
            gas?: AnyNumber;
            gasPrice?: AnyNumber;
            data?: string;
            nonce?: AnyNumber;
        }
    }

    export = Web3;
}
