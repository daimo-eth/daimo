## Scratchpad

For quick scripts and testing.

```
npm start  # shows available commands
```

### Test userops

Play with userops and account abstraction infrastructure.

### Test the Secure Enclave

For that, run the `daimo-testbed` Expo app.

### Mailing list export

Open mailing list in Notion, click Export, choose Markdown and CSV.

Then, run `npm start mailing-list <path to CSV>`

### Format screenshots

To produce nice screenshots like in [this PR](https://github.com/daimo-eth/daimo/pull/50), you have two options.

#### Simulator screenshots

Prereqs:

- [Disable shadows](https://macpaw.com/how-to/remove-mac-screenshot-shadow) on your screenshots.
- Install ImageMagick
- Use the **iPhone 13 mini** in the iOS simulator.

Steps:

1. Take 3 to 6 screenshots showcasing the feature using `Ctrl+Cmd+Shift+4`
2. Run `convert Screenshot*.png  +append +repage -crop +0+128 ds.png`

#### Phone screenshots

1. Take 3 to 6 screenshots on your phone
2. Transfer to laptop
3. Run `convert -bordercolor black -border 50 +append +repage -resize 50% IMG*.jpg ds.png`
