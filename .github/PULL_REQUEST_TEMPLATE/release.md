<!-- PR TITLE -->
<!-- release v1.2.3 build 101 -->
<!-- Build number should be identical across both platforms. -->

** Tweet-length summary of changes. **

<!-- Optional screenshot, 4-6 panels joined as described in scratchpad README. -->

## Release checklist

### API and webapp

- [ ] Branch from `master`
- [ ] Testnet API deployed correctly
- [ ] Testnet webapp deployed correctly
- [ ] Logs look clean

### iOS

Watch all of the following interactions closely for jank and UX regressions, not
just outright bugs.

- [ ] Install from private TestFlight
- [ ] Create testnet account
- [ ] Faucet + notification should appear automatically.
- [ ] Send payment
- [ ] Create Payment Link, open in browser
- [ ] Cancel Payment Link
- [ ] Tap Payment Link, ensure it opens in-app
- [ ] Create Request, open in browser
- [ ] Add device + Use existing onboarding (test transactions work on both devices)
- [ ] Remove device
- [ ] Open History
- [ ] Tap transaction, view in block explorer
- [ ] Account screen: Send Debug Log
- [ ] Debug log looks clean

### Android

- [ ] Install from Play Store closed track
- [ ] Clear account (create one first, if necessary)
- [ ] Create account
- [ ] Faucet + notification should appear automatically
- [ ] Send payment
- [ ] Create Payment Link
- [ ] Cancel Payment Link
- [ ] Tap Payment Link, ensure it opens in-app
- [ ] Add device + Use existing onboarding (test transactions work on both devices)
- [ ] Remove device
- [ ] Create Request
- [ ] Open History
- [ ] Tap transaction, view in block explorer
- [ ] Account screen: Send Debug Log
- [ ] Debug log looks clean

### Push to prod

- [ ] Push to `prod`
- [ ] Prod API deploys correctly
- [ ] Prod website deploys correctly
- [ ] Logs clean
- [ ] Honeycomb clean

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
