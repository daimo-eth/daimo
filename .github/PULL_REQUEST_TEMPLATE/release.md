**App Store "What's New" line goes here.**

## Release checklist

<!-- Prod test for all releases -->

### Production (mainnet) smoke test

#### Deploy prod

- [ ] Push to `prod`
- [ ] Prod API deploys correctly
- [ ] Prod website deploys correctly
- [ ] Logs clean

#### iOS

- [ ] Install from private TestFlight
- [ ] Log into your prod account
- [ ] Send a transfer
- [ ] Notification appears on confirmation

#### Android

- [ ] Install from private TestFlight
- [ ] Log into your prod account
- [ ] Send a transfer
- [ ] Notification appears on confirmation

#### Either platform

- [ ] Log out + create new account
- [ ] Create Payment Link, open in browser.
- [ ] Reclaim link. Refresh page in browser, ensure status shows correctly.
- [ ] Tap link. Ensure opens in app, status shows correctly.
- [ ] Send to USDC Arbitrum
- [ ] Receive Base ETH, test inbox claim

<!-- IF APPLICABLE: any API changes? deploy staging first -->

### Staging test

- [ ] Branch from `master`
- [ ] Testnet API deployed correctly
- [ ] Testnet webapp deployed correctly

#### iOS

Watch all of the following interactions closely for jank and UX regressions, not
just outright bugs.

- [ ] Install from private TestFlight
- [ ] Create testnet account
- [ ] Faucet should appear automatically
- [ ] Send payment
- [ ] Create payment link with memo. Ensure memo appears.
- [ ] Cancel payment link.
- [ ] Create request link with memo. Ensure the memo appears.
- [ ] Add device + Use existing onboarding
- [ ] Remove device
- [ ] Open History
- [ ] Account screen: Send Debug Log
- [ ] Debug log looks clean
- [ ] Send to USDC Sepolia

#### Android

- [ ] Install from Play Store closed track
- [ ] Create testnet account
- [ ] Create account
- [ ] Faucet should appear automatically
- [ ] Send payment
- [ ] Create & cancel payment link
- [ ] Create & cancel request to another account, with memo
- [ ] Account screen: Send Debug Log
- [ ] Debug log looks clean

<!-- IF APPLICABLE: account management tests -->

### Account management

- [ ] Create new account using an invite link
- [ ] Add a passkey, log out + back in using passkey
- [ ] Add a security key, log out + back in with Yubikey
- [ ] Add a seed phrase, log out + back in with seed phrase

<!-- IF APPLICABLE: cross-chain + memo tests -->

### Cross-chain + memo tests

- [ ] Send 500 ARS to a .eth on Optimism, with a memo. Transfer should show "500 ARS · USDC Op · hello world" + the .eth final destination.
- [ ] Send a few cents to each other supported chain. Verify ~immediate receipt.
- [ ] Create a 0.20 EUR payment link with memo. Claim in another account. Currency + memo shows up on both ends.
- [ ] Create a 0.20 GBP request link. Ensure currency + memo appears in webapp + in both sender & receiver app.

<!-- Finish release -->

### Promote release

BEFORE merging this PR,

- [ ] Push to App Store + Play Store, INCLUDING TestFlight + Open test track.
- [ ] Bump version number for next development cycle.

Production mainnet releases will eventually trail TestFlight by at least a week
to allow longer and more thorough testing.
