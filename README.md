<img width="1688" alt="screenshot" src="https://i.imgur.com/tR6urgF.png">
*The choice of DAI and Base is a guess.*

### Daimo is a stablecoin wallet

Daimo is minimalist. Single stablecoin, single rollup, payments only.

No seed phrases. Keys are generated in your phone's secure enclave and never
leave. You can add multiple devices to secure your account. Under the hood, it's
a ERC-4337 contract wallet.

The mission is to make an excellent experience. Payments should be fast, cheap,
secure, and permissionless.

### Development

**Daimo is in active development.** Coming soon to testnet and TestFlight.

- `packages/daimo-mobile` contains the Expo app
- `packages/expo-enclave` contains the native module interfacing with the secure enclave
- `packages/contract` contains the wallet contract
