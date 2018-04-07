declare module 'photon' {
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

    namespace photon {
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

            finishMinting(options?: TransactionOptions): Promise<TransactionResult>;
        }

        interface MintEvent {
            to: Address;
            amount: BigNumber;
        }

        type MintFinishedEvent = {};

        interface PhotonToken extends MintableToken {
            name(): Promise<string>;
            symbol(): Promise<string>;
            decimals(): Promise<BigNumber>;
            maximumSupply(): Promise<BigNumber>;
        }

        interface MigrationsContract extends Contract<Migrations> {
            'new'(options?: TransactionOptions): Promise<Migrations>;
        }

        interface PhotonTokenContract extends Contract<PhotonToken> {
            'new'(options?: TransactionOptions): Promise<PhotonToken>;
        }

        interface PhotonArtifacts extends TruffleArtifacts {
            require(name: string): AnyContract;
            require(name: './Migrations.sol'): MigrationsContract;
            require(name: './PhotonToken.sol'): PhotonTokenContract;
        }
    }

    export = photon;
}
