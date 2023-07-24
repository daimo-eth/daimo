<img width="2110" alt="Screenshot" src="https://github.com/daimo-eth/daimo/assets/169280/09a716ba-4ed2-4332-b10f-c0eeeec16b71">

### Daimo is a stablecoin wallet

We're starting minimalist. Single stablecoin, single rollup, payments only.

No seed phrases. Keys are generated in your phone's secure enclave and never
leave. You can add multiple devices to secure your account. Under the hood, it's
a ERC-4337 contract wallet.

The mission is to make an excellent experience. Payments should be fast, secure, and permissionless.

### Development

**Daimo is under active development.** Coming soon to testnet and TestFlight.

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
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
# Reload your terminal, then run:
foundryup
```

```
# Install Expo EAS
npm i -g eas-cli
```

Next, build the app.

```
npm i
npm run build
```

Configure the API.

- To run the API locally, configure the `DAIMO_API_*` env vars.
  - You can run a Postgres instance in the background locally using `initdb daimo && pg_ctl -D daimo start`. To stop, use `pg_ctl -D daimo stop`.
- To use the testnet staging API, just set `DAIMO_APP_API_URL=https://daimo-api-stage.onrender.com`.

Finally, run the app in the iOS simulator.

If you're in the <a href="https://expo.dev/accounts/daimo">Daimo team on Expo</a>, you can download the latest base build from there.

> Expo apps come in two layers: a native layer and a React Native (typescript) layer. Whenever you add a native module or update `@daimo/expo-enclave`, you must rebuild the native app. For details, see the `@daimo/mobile` package.

Once the base app is installed in your simulator, you can run Daimo:

```
npm run dev
```

## Running the backend

`daimo-mobile` and `daimo-web` both rely on `daimo-api`.

By default:

- `daimo-mobile` runs the Expo incremental build server on localhost:8080
- `daimo-web` runs the web app, including fallback deeplinks, on localhost:3001
- `daimo-api` runs the TRPC API on localhost:3000

</details>
