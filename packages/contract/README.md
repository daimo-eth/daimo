## Contracts

Our main contracts:

-   DaimoAccount - ERC-4337 contract wallet
-   DaimoAccountFactory - deploys DaimoAccounts behind an ERC1967Proxy
-   DaimoEphemeralNotes - stores notes aka Payment Links, used to pay people who don't yet have an account
-   DaimoNameRegistry - maps account names to addresses

See also the EIP-7212 [P256Verifier](https://github.com/daimo-eth/p256-verifier) contract.

### Building the contracts

1. **Install Foundryup**

    ```
    curl -L https://foundry.paradigm.xyz | bash
    ```

2. **Install Foundry**

    ```
    foundryup
    ```

3. **Build contracts**

    ```
    make build
    ```

### Testing

Set the `BASE_MAINNET_RPC` environment variable to a Base Mainnet RPC URL.

Use the commands in the `test-contract` section of [ci.yml](../.github/workflows/ci.yml) to run tests.

**Test Coverage**

To view test coverage, change the test command from `forge test` to `forge coverage` and add the `--report lcov` flag.

For example, if the test command is

```
export BASE_MAINNET_RPC=https://base-rpc.publicnode.com
```

To run tests:

```
make test
```

To view detailed test coverage:

```
make coverage
```

You can see line-by-line coverage in VSCode using the recommended extension. Run
`Cmd+Shift+P` > `Coverage Gutters: Display Coverage`.
