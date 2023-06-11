<img width="1688" alt="screenshot" src="https://i.imgur.com/tR6urgF.png">

_The choice of DAI and Base is a guess._

### Daimo is a stablecoin wallet

Daimo is minimalist. Single stablecoin, single rollup, payments only.

No seed phrases. Keys are generated in your phone's secure enclave and never
leave. You can add multiple devices to secure your account. Under the hood, it's
a ERC-4337 contract wallet.

The mission is to make an excellent experience. Payments should be fast, secure, and permissionless.

### Development

You'll need Node 20 and recent Xcode. Clone the repo, loading submodules.

```
git clone git@github.com:daimo-eth/daimo --recurse-submodules
```

Install prerequisites.

```
# Install Foundry, if you haven't yet.
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

Finally, run the app in the iOS simulator.

```
npm start
```
