<!-- PR TITLE -->
<!-- release v1.2.3 build 101 -->
<!-- Build number should be identical across both platforms. -->

** Tweet-length summary of changes. **

<!-- Optional screenshot, 4-6 panels joined as described in scratchpad README. -->

## Release checklist

### API and webapp

- [ ] Push to stage
- [ ] API deployed correctly
- [ ] Webapp deployed correctly
- [ ] No new or increased Sentry errors
- [ ] Logs look clean

### iOS

Watch all of the following interactions closely for jank and UX regressions, not
just outright bugs.

- [ ] Install from private TestFlight
- [ ] Clear account (create one first, if necessary)
- [ ] Create account
- [ ] Request faucet
- [ ] Notification appears on faucet send
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
- [ ] Request faucet
- [ ] Notification appears on faucet send
- [ ] Send payment
- [ ] Create Payment Link, open in browser
- [ ] Cancel Payment Link
- [ ] Tap Payment Link, ensure it opens in-app
- [ ] Add device + Use existing onboarding (test transactions work on both devices)
- [ ] Remove device
- [ ] Create Request, open in browser
- [ ] Open History
- [ ] Tap transaction, view in block explorer
- [ ] Account screen: Send Debug Log
- [ ] Debug log looks clean

### Promote release

BEFORE merging this PR,

- [ ] Push to public TestFlight + Play Store open test track.

Production mainnet releases will eventually trail TestFlight by at least a week
to allow longer and more thorough testing.
