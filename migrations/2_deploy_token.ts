import { PhotochainArtifacts } from 'photochain';
import { Deployer } from 'truffle';

declare const artifacts: PhotochainArtifacts;

const PhotochainTestToken = artifacts.require('./PhotochainTestToken.sol');

async function deploy(deployer: Deployer) {
    await deployer.deploy(PhotochainTestToken);
}

function migrate(deployer: Deployer) {
    deployer.then(() => deploy(deployer));
}

export = migrate;
