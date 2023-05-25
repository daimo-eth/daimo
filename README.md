> `EXPERIMENTAL`

This is a prototype self-custody stablecoin wallet.

No seed phrases. Keys are generated in your phone's secure enclave and never leave.

You can add multiple devices for safety, either your own or your friends' (social recovery).

L2 native. This wallet is designed to use a single L2 and a single stablecoin for an extremely simple experience, like Venmo or Zelle.

## Development

- `packages/daimo-mobile` contains the Expo app
- `packages/expo-enclave` contains the native module interfacing with the secure enclave
- `packages/contract` contains the wallet contract
