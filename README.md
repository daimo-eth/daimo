<img alt="Screenshot" src="https://github.com/daimo-eth/daimo/assets/169280/637cd1be-b4b9-4bad-a4e0-df2ebf9216a8">

### Daimo is a stablecoin wallet

Single stablecoin, single rollup, payments only. Cross-chain transfers coming soon.

No seed phrases. Keys are generated in your phone's secure enclave and never
leave. You can add multiple devices to secure your account. Under the hood, it's
a ERC-4337 contract wallet.

The mission is to make an excellent experience. Payments should be fast, secure, and permissionless.

<!-- THE FAQ BELOW APPEARS AUTOMATICALLY ON THE WEBSITE. EDIT WITH CARE. -->

### FAQ

- <details><summary>How do Daimo accounts work?</summary>

  Daimo accounts are Ethereum accounts.

  Under the hood, they're a new and much-improved type called an ERC-4337 contract account. Each device you add to your account stores a secret key. When you send money, your phone first authenticates you with FaceID or similar, then cryptographically signs the transaction using that key.

  Daimo is non-custodial. Your keys, your coins.

  Daimo offers stronger security than traditional wallets. Keys live in dedicated hardware made for storing secrets, such as Secure Enclave on iPhone, and never leave your device.

  </details>

- <details><summary>Which stablecoin does Daimo use?</summary>

  Daimo runs on USDC, a high-quality stablecoin issued by Circle.

  Stablecoins are cryptocurrencies designed to maintain a stable value. Many are pegged to the dollar, so that one coin is worth $1. Circle is a US-based licensed money transmitter partnered with Coinbase. USDC is one of the largest and most liquid onchain dollar equivalents. <a target="_blank" href="https://bluechip.org/coins/usdc" >Learn more on Bluechip.</a>
  </details>

- <details><summary>Which blockchain does it run on?</summary>

  Daimo uses Base, an Ethereum rollup.

  Rollups support near-instant transactions that cost a few cents each. By contrast, transactions on the underlying Ethereum chain (layer 1 or L1) take about 10 times as long and cost a few dollars each. Rollups accomplish this by bundling many transactions into a single L1 transaction. They inherit the strong guarantees of Ethereum: like L1, Base is reliable and secure, and works worldwide. <a target="_blank"  href="https://l2beat.com/">Learn more on L2Beat.</a>
  </details>

- <details><summary>Can I send other coins like USDT, or use other chains like Polygon?</summary>

  Not yet. We plan to support payments in other stablecoins and on other chains soon.
  </details>

- <details><summary>Who can see my Daimo transactions?</summary>

  Currently, all Ethereum transactions are generally public, including Daimo transactions. We plan to add private payments as the infrastructure and support for them matures.
  </details>

- <details><summary>Is Daimo open source?</summary>

  Yes, Daimo is and will always be open-source under GPLv3. We're here to collaborate. We want to make self-custody fast, safe, and easy. <a target="_blank" href="https://github.com/daimo-eth/daimo">See more on our Github.</a>
  </details>

### Development

**Daimo is under active development.** Now on testnet, TestFlight, and in Play
Store open testing.

Veridise's audit report of our codebase is available [here](./audits/2023-10-veridise.pdf).

<details>
<summary><strong>Architecture</strong></summary>
<img src="/doc/architecture.excalidraw.svg" />

**READMEs for each app and package.**

- [apps/daimo-mobile](apps/daimo-mobile) mobile app. Typescript + Expo
- [apps/daimo-web](apps/daimo-web) web app, including deep links. Typescript + NextJS
- [packages/contract](packages/contract) contracts, Solidity + Forge
- [packages/daimo-api](packages/daimo-api) API, including indexer. Typescript + Node
- [packages/daimo-common](packages/daimo-common) data models common to clients and API. Typescript
- [packages/daimo-expo-enclave](packages/daimo-expo-enclave) hardware enclave interface. Typescript, Kotlin, Swift + Expo native module
- [packages/daimo-userop](packages/daimo-userop) account abstraction interface. Typescript

</details>

<details>
<summary><strong>Quick start for developers</strong></summary>

Clone the repo, loading submodules.

```
git clone git@github.com:daimo-eth/daimo --recurse-submodules
```

Install prerequisites.

```
# You'll need Node 20+
node --version
```

```
# (Optional) for contract development, install Foundry
curl -L https://foundry.paradigm.xyz | bash
# Reload your terminal, then run:
foundryup
```

```
# (Optional) for mobile development, install Expo EAS
npm i -g eas-cli
```

Next, build the app.

```
npm i
npm run build
```

Finally, run the app in the iOS simulator, Android simulator, or on your phone.

If you're in the <a href="https://expo.dev/accounts/daimo">Daimo team on Expo</a>, you can download the latest development build from there.

> Expo apps come in two layers: a native layer and a React Native (typescript) layer. Whenever you add a native module or update `@daimo/expo-enclave`, you must rebuild the native app. For details, see `apps/daimo-mobile`.

Once the base app is installed in your simulator, you can run Daimo.

```
# Run mobile app, local API server, and web app (for deep links) simultaneously.
# Requires Postgres, see API Setup below.
npm run dev
```

Running `npm run dev` in the root directory is equivalent to running it concurrently in each `apps/...` and `packages/...` directory.

```
# Alternatively, to run JUST the mobile app.
cd apps/daimo-mobile
DAIMO_DOMAIN=daimo.xyz DAIMO_APP_API_URL=https://daimo-api-stage.onrender.com npm run dev
```

Either way, you get hot reloading.

<details>
<summary><strong>API Setup</strong></summary>

`daimo-mobile` and `daimo-web` both rely on `daimo-api`.

By default:

- `daimo-mobile` runs the Expo incremental build server on localhost:8080
- `daimo-web` runs the web app, including fallback deeplinks, on localhost:3001
- `daimo-api` runs the TRPC API on localhost:3000

You'll need to either use the hosted Daimo API or run one locally.

- To run the API locally, configure the `DAIMO_API_*` secrets, then run `npm run dev`.
- You can run Postgres in the background locally using `initdb daimo && pg_ctl -D daimo start`. To stop, use `pg_ctl -D daimo stop`.
- To use the testnet staging API, just set `DAIMO_APP_API_URL=https://daimo-api-stage.onrender.com`. You can run both the mobile and web app this way.
</details>

<details>
<summary><strong>Setup for android</strong></summary>

- **Ensure you have the correct Java version.** Version 20 doesn't work, Java 17 works.
- You need to `ANDROID_HOME` to the local Android SDK.
- Install Android Studio, and create an emulator.
- Download latest Android internal distribution build from Expo, and install it in the emulator.
- Lastly, go to `apps/daimo-mobile` and run `npm run dev:android`.
</details>

</details>

<details>
<summary><strong>Release instructions</strong></summary>

Start from latest `master` with green CI. Create a release candidate for each platform.

```
cd apps/daimo-mobile
npm run build:stage
npm run build:stage-android
```

The last two run concurrently and submit automatically within ~10 minutes. Build
versions increment automatically, creating a diff.

While you wait, update the API and webapp.

- Make a release PR stating the new, incremented build version.
- Push to `stage`. PR into `master` remains open.
- Complete the API and webapp checklist in the PR. Roll back if necessary.
- By now, builds should be done. Install on Android. Install on iOS.
- Complete app release testing checklist. You've now shipped a new public TestFlight and Play Store test release
- Finally, merge the PR.

</details>
