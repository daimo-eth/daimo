<img alt="Screenshot" src="https://github.com/daimo-eth/daimo/assets/169280/637cd1be-b4b9-4bad-a4e0-df2ebf9216a8">

### Daimo is a stablecoin wallet

Single stablecoin, single rollup, payments only. Cross-chain transfers coming soon.

No seed phrases. Keys are generated in your phone's secure enclave and never
leave. You can add multiple devices and create Passkey backups to secure your
account. Under the hood, it's a ERC-4337 contract wallet.

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

### Security

#### Audits

Past audits of the Daimo codebase can be found in the `audits` folder:

- [Veridise audit 2023 Oct: Daimo](./audits/2023-10-veridise-daimo.pdf)
- [Veridise audit 2023 Oct: P-256 verifier](./audits/2023-10-veridise-p256.pdf)
- [Veridise audit 2023 Nov: WebAuthn verifier](./audits/2023-11-veridise-webauthn.pdf)

#### Bug Bounty Program

Daimo hosts a bug bounty program on [Immunefi](https://immunefi.com/bounty/daimo/). Learn more on [SECURITY.md](./SECURITY.md).

### Development

**Daimo is under active development.** Now in App Store and Play Store with an
invite code. Coming soon: desktop app, no invite code, cross-chain support.

<details>
<summary><strong>Architecture</strong></summary>
<img src="/doc/architecture.excalidraw.svg" />

**READMEs for each app and package.**

- [apps/daimo-mobile](apps/daimo-mobile) mobile app. Typescript + Expo
- [apps/daimo-web](apps/daimo-web) web app, including deep links. Typescript + NextJS
- [packages/contract](packages/contract) contracts, Solidity + Forge
- [packages/daimo-api](packages/daimo-api) API, including indexer. Typescript + Node
- [packages/daimo-common](packages/daimo-common) data models common to apps and API. Typescript
- [packages/daimo-expo-enclave](packages/daimo-expo-enclave) hardware enclave interface. Typescript, Kotlin, Swift + Expo native module
- [packages/daimo-userop](packages/daimo-userop) account abstraction interface. Typescript

</details>

<details>
<summary><strong>Dev quickstart</strong></summary>

Clone the repo, loading submodules.

```sh
git clone git@github.com:daimo-eth/daimo --recurse-submodules
```

Build the app.

```sh
node --version # ensure you have node 20+
npm i
npm run build
```

Run the iPhone Simulator in XCode. (If you're not on a Mac, see the
Android quick start below.) Get the latest simulator build from Expo; message us
if you need access. Drag-drop the build into the simulator to install.

Set the following variables to use the remote, hosted API.

```sh
export DAIMO_APP_API_URL_TESTNET="https://daimo-api-testnet.onrender.com"
export DAIMO_APP_API_URL_MAINNET="https://daimo-api-prod.onrender.com"
export DAIMO_DOMAIN="daimo.com"
```

Finally, run the app in the simulator.

```sh
cd apps/daimo-mobile
npm run dev
```

**Use invite code `testnet`.** Once you create an account, you should
automatically get some testnet USDC from the faucet.

> Expo apps come in two layers: a native layer and a React Native (Typescript)
> layer. Whenever you add a native module or update `@daimo/expo-enclave`, you
> must rebuild the native app. For details, see `apps/daimo-mobile`.

</details>

<details>
<summary><strong>Dev quickstart: Android</strong></summary>

- **Ensure you have the correct Java version.** Version 20 doesn't work, Java 17 works.
- You need to `ANDROID_HOME` to the local Android SDK.
- Install Android Studio, and create an emulator.
- Download latest Android internal distribution build from Expo, and install it in the emulator.

All other instructions are the same as above. After `npm run dev`, type `a` to
open the Android simulator. You should now have both side-by-side. See the
mobile `package.json` for details.

</details>

<details>
<summary><strong>Dev quickstart: contracts</strong></summary>

Install Foundry.

```sh
curl -L https://foundry.paradigm.xyz | bash
# Reload your terminal, then run:
foundryup
```

Build the contracts.

```sh
forge build
```

For commands to run tests and recompute code coverage, see `ci.yml`.

</details>

<details>
<summary><strong>Dev quickstart: API</strong></summary>

`daimo-mobile` and `daimo-web` both rely on `daimo-api`.

By default:

- `daimo-mobile` runs the Expo incremental build server on localhost:8080
- `daimo-web` runs the web app, including fallback deeplinks, on localhost:3001
- `daimo-api` runs the TRPC API on localhost:3000

You'll need to either use the hosted Daimo API or run one locally.

To run the API locally, fill in the `DAIMO_API_...` and `NEXT_PUBLIC_...`
environment variables. Message us if you need help.

You can run Postgres in the background locally using
`initdb daimo && pg_ctl -D daimo start`. To stop, use `pg_ctl -D daimo stop`.

Once you're running the API locally, you can run the full stack self-contained.

```sh
# First tab
cd packages/daimo-api && npm run dev
# Second tab
cd apps/daimo-mobile && npm run dev
# Third tab
cd apps/daimo-web && npm run dev
```

</details>
</details>
