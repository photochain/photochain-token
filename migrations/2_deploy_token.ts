import { PhotochainArtifacts } from 'photochain';
import { Deployer } from 'truffle';

declare const artifacts: PhotochainArtifacts;

const PhotochainToken = artifacts.require('./PhotochainToken.sol');

async function deploy(deployer: Deployer) {
    await deployer.deploy(PhotochainToken);
}

function migrate(deployer: Deployer) {
    deployer.then(() => deploy(deployer));
}

export = migrate;
