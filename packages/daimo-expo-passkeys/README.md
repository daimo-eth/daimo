# daimo-expo-passkeys

Opinionated passkeys/webauthn interface for Expo apps that use passkeys for 
authentication using the private/public keypairs directly rather than using them
for server authentication/login.

This means we make some choices that do not follow the WebAuthn spec
recommendations. For example,

- The challenges are not random server-generated strings, but rather will be 
  deterministic based on the message we want the user to sign. This means for a 
  wallet application like Daimo, these will be transaction hashes.
- We do not follow the recommendation that user IDs should be random/uncorrelated 
  with the user's identity. Instead, we use a base-64 encoded username as the user 
  ID. This is fine for our use case as described on [Stackoverflow](https://stackoverflow.com/a/76663224). Note that the keys are already publicly associated with the user's identity (as both their account address/name and the key are public on the blockchain).
- We return and use a simplified interface to requests and responses, rather than
  the full WebAuthn spec.

Recommended readings:
- [Webauthn Guide](https://webauthn.guide)
- [Webauthn Spec](https://w3c.github.io/webauthn/)
- [Yubico's WebAuthn Developer Guide](https://developers.yubico.com/WebAuthn/WebAuthn_Developer_Guide/)