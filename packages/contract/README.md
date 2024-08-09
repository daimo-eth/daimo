## Contracts

Our main contracts:

- DaimoAccount - ERC-4337 contract wallet
- DaimoAccountFactory - deploys DaimoAccounts behind an ERC1967Proxy
- DaimoEphemeralNotes - stores notes aka Payment Links, used to pay people who don't yet have an account
- DaimoNameRegistry - maps account names to addresses

See also the EIP-7212 [P256Verifier](https://github.com/daimo-eth/p256-verifier) contract.

### Testing

```
foundryup
```

Use the commands in the `test-contract` section of [ci.yml](../.github/workflows/ci.yml) to run tests.

**Test Coverage**

To view test coverage, change the test command from `forge test` to `forge coverage` and add the `--report lcov` flag.

For example, if the test command is

```
forge test --fork-url "https://base-sepolia.publicnode.com"
```

Run this command instead

```
forge coverage --report lcov --fork-url "https://base-sepolia.publicnode.com"
```


You can see line-by-line coverage in VSCode using the recommended extension. Run
`Cmd+Shift+P` > `Coverage Gutters: Display Coverage`.
