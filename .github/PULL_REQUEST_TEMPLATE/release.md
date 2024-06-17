**Tweet-length summary of changes.**

## Release checklist

### API and webapp

- [ ] Branch from `master`
- [ ] Testnet API deployed correctly
- [ ] Testnet webapp deployed correctly

### iOS

Watch all of the following interactions closely for jank and UX regressions, not
just outright bugs.

- [ ] Install from private TestFlight
- [ ] Create testnet account
- [ ] Faucet + notification should appear automatically.
- [ ] Send payment
- [ ] Create payment link with memo. Ensure memo appears.
- [ ] Cancel payment link.
- [ ] Create request link with memo. Ensure the memo appears.
- [ ] Add device + Use existing onboarding (test transactions work on both devices)
- [ ] Remove device
- [ ] Open History
- [ ] Account screen: Send Debug Log
- [ ] Debug log looks clean

### Android

- [ ] Install from Play Store closed track
- [ ] Clear account (create one first, if necessary)
- [ ] Create account
- [ ] Faucet + notification should appear automatically
- [ ] Send payment
- [ ] Create & cancel payment link
- [ ] Create & cancel request to another account, with memo
- [ ] Account screen: Send Debug Log
- [ ] Debug log looks clean

### macOS

Smoke test, particularly for visual regressions:

- [ ] Install from Testflight
- [ ] Send payment
- [ ] Share invite link
- [ ] Delete account and restore from passkey backup

### Push to prod

- [ ] Push to `prod`
- [ ] Prod API deploys correctly
- [ ] Prod website deploys correctly
- [ ] Logs clean
- [ ] Sentry clean

### Prod smoke test

- [ ] Log back into prod account
- [ ] Send a transfer
- [ ] Notification appears on confirmation
- [ ] Create Payment Link, open in browser.
- [ ] Reclaim link. Refresh page in browser, ensure status shows correctly.
- [ ] Tap link. Ensure opens in app, status shows correctly.

### Promote release

BEFORE merging this PR,

- [ ] Push to App Store + Play Store, INCLUDING TestFlight + Open test track.
- [ ] Bump version number for next development cycle.

Production mainnet releases will eventually trail TestFlight by at least a week
to allow longer and more thorough testing.
