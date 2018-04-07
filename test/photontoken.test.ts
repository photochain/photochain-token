import { assert } from 'chai';
import { PhotonArtifacts, PhotonToken } from 'photon';
import { ContractContextDefinition } from 'truffle';
import * as Web3 from 'web3';

import { assertNumberEqual, assertPhotonEqual, PHT_DECIMALS, toPhoton } from './helpers';

declare const web3: Web3;
declare const artifacts: PhotonArtifacts;
declare const contract: ContractContextDefinition;

const PhotonToken = artifacts.require('./PhotonToken.sol');

contract('PhotonToken', accounts => {
    describe('Constructor', () => {
        let token: PhotonToken;

        beforeEach(async () => {
            token = await PhotonToken.deployed();
        });

        it('should set name', async () => {
            assert.equal(await token.name(), 'PhotonToken');
        });

        it('should set symbol', async () => {
            assert.equal(await token.symbol(), 'PHT');
        });

        it('should set decimals', async () => {
            assertNumberEqual(await token.decimals(), PHT_DECIMALS);
        });

        it('should set maximumSupply', async () => {
            assertPhotonEqual(await token.maximumSupply(), toPhoton(230_000_000));
        });

        it('should start with zero totalSupply', async () => {
            assertPhotonEqual(await token.totalSupply(), 0);
        });

        it('should set owner', async () => {
            assert.equal(await token.owner(), accounts[0]);
        });
    });
});
