declare module 'photochain' {
    import {
        AnyContract,
        Contract,
        ContractBase,
        TransactionOptions,
        TransactionResult,
        TruffleArtifacts
    } from 'truffle';
    import { AnyNumber } from 'web3';
    import { BigNumber } from 'bignumber.js';

    namespace photochain {
        interface Migrations extends ContractBase {
            setCompleted(completed: number, options?: TransactionOptions): Promise<TransactionResult>;

            upgrade(address: Address, options?: TransactionOptions): Promise<TransactionResult>;
        }

        interface Ownable extends ContractBase {
            owner(): Promise<Address>;

            transferOwnership(newOwner: Address): Promise<TransactionResult>;
        }

        interface TransferEvent {
            from: Address;
            to: Address;
            value: BigNumber;
        }

        interface ApprovalEvent {
            owner: Address;
            spender: Address;
            value: BigNumber;
        }

        interface ERC20 extends ContractBase {
            totalSupply(): Promise<BigNumber>;
            balanceOf(who: Address): Promise<BigNumber>;
            allowance(owner: Address, spender: Address): Promise<BigNumber>;

            transfer(to: Address, amount: BigNumber, options?: TransactionOptions): Promise<TransactionResult>;

            transferFrom(
                from: Address,
                to: Address,
                value: AnyNumber,
                options?: TransactionOptions
            ): Promise<TransactionResult>;

            approve(spender: Address, value: AnyNumber, options?: TransactionOptions): Promise<TransactionResult>;
        }

        interface ApprovalEvent {
            owner: Address;
            spender: Address;
            value: BigNumber;
        }

        interface MintableToken extends ERC20, Ownable {
            mintingFinished(): Promise<boolean>;
            isMintingManager(addr: Address): Promise<boolean>;

            mint(to: Address, amount: AnyNumber, options?: TransactionOptions): Promise<TransactionResult>;
            mintMany(to: Address[], amount: AnyNumber[], options?: TransactionOptions): Promise<TransactionResult>;

            finishMinting(options?: TransactionOptions): Promise<TransactionResult>;
        }

        interface MintEvent {
            to: Address;
            amount: BigNumber;
        }

        type MintFinishedEvent = {};

        interface PhotochainToken extends MintableToken {
            name(): Promise<string>;
            symbol(): Promise<string>;
            decimals(): Promise<BigNumber>;
            maximumSupply(): Promise<BigNumber>;

            increaseAllowance(spender: Address, subtractedValue: AnyNumber): Promise<TransactionResult>;
            decreaseAllowance(spender: Address, subtractedValue: AnyNumber): Promise<TransactionResult>;
        }

        interface PhotochainVesting extends ContractBase {
            token(): Promise<Address>;
            beneficiary(): Promise<Address>;
            releaseTime(): Promise<BigNumber>;

            release(): Promise<TransactionResult>;
        }

        interface MigrationsContract extends Contract<Migrations> {
            'new'(options?: TransactionOptions): Promise<Migrations>;
        }

        interface PhotochainTokenContract extends Contract<PhotochainToken> {
            'new'(options?: TransactionOptions): Promise<PhotochainToken>;
        }

        interface PhotochainVestingContract extends Contract<PhotochainVesting> {
            'new'(
                token: Address,
                beneficiary: Address,
                releaseTime: AnyNumber,
                options?: TransactionOptions
            ): Promise<PhotochainVesting>;
        }

        interface PhotochainArtifacts extends TruffleArtifacts {
            require(name: string): AnyContract;
            require(name: './Migrations.sol'): MigrationsContract;
            require(name: './PhotochainToken.sol'): PhotochainTokenContract;
            require(name: './PhotochainVesting.sol'): PhotochainVestingContract;
        }
    }

    export = photochain;
}
