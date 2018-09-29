Photochain Token
---

Collection of Ethereum smart contracts for the
[Photochain](https://photochain.io) platform token

# Technology

The project uses [Truffle framework](http://truffleframework.com/) and the smart
contracts are written in Solidity language (version 0.4.24).

To compile the smart contracts and run tests you need:
- NodeJS in version 6 or above
- NPM in version 5 or above

# Token mechanics

Photochain token (ticker PHT) implements
[ERC20](https://en.wikipedia.org/wiki/ERC20) interface and is compatible with
all wallets and exchanges that support this standard.

The token extends the ERC20 interface in a backward compatible way with features
essential for crowdsale distribution, like:
- minting tokens for specified addresses by an authorized party,
- finishing minting and preventing future inflation of supply,
- hard cap, limiting total supply to the maximum of 120 mln PHT tokens created
  in the process of minting

Only sold and allocated tokens are minted, there is no need to burn unsold
tokens.

## Minting

Minting features are implemented in
[MintableToken.sol](https://github.com/photochain/photochain-token/blob/master/contracts/MintableToken.sol)
and are based on [Zeppelin
contracts](https://github.com/OpenZeppelin/zeppelin-solidity/) with minor
changes covering clean code and compatibility with the newest Solidity compiler.

The token can be in two states:

![Alt text](https://g.gravizo.com/source/custom_mark10?https%3a%2f%2fraw.githubusercontent.com%2fphotochain%2fphotochain-token%2fmaster%2fREADME.md)
<details> 
<summary></summary>
custom_mark10
  digraph G {
    mintable -> nonMintable [label="finishMinting"];
  }
custom_mark10
</details>

The contract starts in `minting` state. After calling `finishMinting()`, it is
not possible to create any more tokens. Total supply becomes sealed and `mint()`
function will revert when called.

Minting is possible only by the owner of the contract. By default, it is the
deploying address, but can be changed later.

The hard cap serves as additional protection against exceeding the supply of 120
mln PHT. Total supply can be lower because only sold and allocated tokens are
minted.

## Distribution process

After crowdsale end, contributions will be processed taking into account time of
contribution, crowdsale stage and vesting periods. Calculated amount of tokens
will be minted for each contributor calling `mint()` function:

```javascript
for (const contributor of contributors) {
    await pht.mint(contributor.address, contributor.amount);
}

await pht.finishMinting();
```

When all sold and allocated tokens are minted, `finishMinting()` will be called
to prevent further creation of Photochain tokens. Participants will be able to
see their balances and transfer tokens immediately. Those under agreed vesting
period will have their tokens allocated in a dedicated smart contract that will
release their tokens after expiration of vesting period.

# Tests

To run tests, first install dependencies:

```
npm install
```

Then, run `test` script

```
npm test
```
