## Contracts

Our main contracts:

- DaimoAccount - ERC-4337 contract wallet
- DaimoAccountFactory - deploys DaimoAccounts behind an ERC1967Proxy
- DaimoEphemeralNotes - stores notes aka Payment Links, used to pay people who don't yet have an account
- DaimoNameRegistry - maps account names to addresses

See also the EIP-7212 [P256Verifier](https://github.com/daimo-eth/eip-7212) contract.

### Testing

```
forge test
forge coverage
```

Before making a PR, update detailed coverage:

```
forge coverage --report lcov
```

You can see line-by-line coverage in VSCode using the recommended extension.
