import { PhotonArtifacts } from 'photon';
import { Deployer } from 'truffle';

declare const artifacts: PhotonArtifacts;

const PhotonToken = artifacts.require('./PhotonToken.sol');

async function deploy(deployer: Deployer) {
    await deployer.deploy(PhotonToken);
}

function migrate(deployer: Deployer) {
    deployer.then(() => deploy(deployer));
}

export = migrate;
