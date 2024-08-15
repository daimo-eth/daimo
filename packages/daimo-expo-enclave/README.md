# expo-enclave

Expo module to abstract the interface to P256 key management APIs on iOS and Android. Uses the maximum security available on the device whenever available (Secure Enclave on iOS, Strongbox on Android).

# On Android Key Security

Since Android supports a range of devices, the security of the key lies on a large spectrum. It seems primarily, there are two orthogonal axis for the security of the private key:

## Key Management/Secure Enclave structure:

Depending on where the keys are stored and processed for signatures and other operations, there are three levels (in increasing order of security):

1. Software only: Weakest, only a weak software abstraction to isolate access to the key data, can be broken by kernel attacks and such. Kinda similar in security level to normal iOS/macOS Keychain (encrypted) keys.
2. TEE: Medium, secure "area" of processor/OS with a lot of shared surface with main OS. Generally runs its own software and communicates with "main" OS via some restricted interface. OS compromises should usually not break security, but kernel exploits might, and these are not resistant to side channel attacks and such. Kinda like a poor man's secure enclave.
3. StrongBox: Strongest, entirely separate chip with its own RAM, CPU etc., usually require at least firmware level attacks to break security. Equivalent to Apple's Secure Enclaves.

In reality, this API is not exactly reflective of the ground truth as device manufacturers are liberal with their definition of each one and not particularly intellectually honest, but we ignore those concerns and trust what the API believes the security level is is reflective of the hardware ground truth.

## Biometrics:

The word biometrics on android is a catch all for any permissioning mechanism (including device PINs). There's 4 levels possible in theory:

1. None
2. DEVICE_CREDENTIAL: Pin, pattern or password
3. BIOMETRIC_WEAK: "class 2" *weak* biometric auth (e.g. fingerprint, iris, or face)
4. BIOMETRIC_STRONG: "class 3" *strong* biometric auth

We make the opinionated choice by looking at some of the BIOMETRIC_WEAK ground truth devices that they provide a false sense of security, so *we do not support that mode*. Further, we note that strong biometrics are in theory as good (if not better) than proper device credentials, so we choose to collapse them together (with "or")[^1]. Therefore, in practice, Daimo has two levels:

1. None
2. BIOMETRIC_STRONG or DEVICE_CREDENTIAL

[1]: Note that this is also what iOS's `.userPresence` key flag does, so we're not being uniquely opinionated here.

So, all in all, we have a 3x2 tradeoff space to communicate to a user:

|                                           	| **SW-Only** 	| **TEE** 	| **Secure Enclave/StrongBox** 	|
|-------------------------------------------	|-------------	|---------	|------------------------------	|
| **None**                                  	| 1           	| 2       	| 4                            	|
| **BIOMETRIC_STRONG or DEVICE_CREDENTIAL** 	| N/A         	| 3       	| 5                            	|

The numbers indicate the security level of each one (the higher the more secure). Note that the iOS version of the expo-enclave module is either 1 or 5, no in-betweens. Thus, for iOS, communicating these is simple. For Android, ideally, we should communicate both the axis of security to the user independently, which for this module translates to exposing two functions that expose each one (`getHardwareSecurityLevel`). Note that we do not support no authentication (and enforce the user to set at least a device PIN) so the second axis is always authenticating biometrics or device passwords of some kind.

# API documentation

We use an account based model to allow for management of multiple keys on the same package easily. Keypairs are attached to `accountName`, passed to the module on calls. See the typescript docs for more detailed documentation, and the example app that has been tested on a range of devices: Android simulator, Pixel 3 (with Strongbox and biometrics), iOS Simulator, iPhone 14 (with Secure Enclave).

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npm install expo-enclave
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.


### Configure for Android



# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
