import { PhotonArtifacts } from 'photon';
import { Deployer } from 'truffle';

declare const artifacts: PhotonArtifacts;

const PhotonTestToken = artifacts.require('./PhotonTestToken.sol');

async function deploy(deployer: Deployer) {
    await deployer.deploy(PhotonTestToken);
}

function migrate(deployer: Deployer) {
    deployer.then(() => deploy(deployer));
}

export = migrate;
