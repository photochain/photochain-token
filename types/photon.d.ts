declare module 'photon' {
    import {
        AnyContract,
        Contract,
        ContractBase,
        TransactionOptions,
        TransactionResult,
        TruffleArtifacts
    } from 'truffle';

    namespace photon {
        interface Migrations extends ContractBase {
            setCompleted(
                completed: number,
                options?: TransactionOptions
            ): Promise<TransactionResult>;

            upgrade(
                address: Address,
                options?: TransactionOptions
            ): Promise<TransactionResult>;
        }

        interface Ownable extends ContractBase {
            owner(): Promise<Address>;

            transferOwnership(newOwner: Address): Promise<TransactionResult>;
        }

        interface MigrationsContract extends Contract<Migrations> {
            'new'(options?: TransactionOptions): Promise<Migrations>;
        }

        interface PhotonArtifacts extends TruffleArtifacts {
            require(name: string): AnyContract;
            require(name: './Migrations.sol'): MigrationsContract;
        }
    }

    export = photon;
}
