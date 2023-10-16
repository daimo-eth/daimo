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
  with the user's identity. Instead, we use the user's account name as the user 
  ID. This is fine for our use case as described on [Stackoverflow](https://stackoverflow.com/a/76663224).
- We return and use a simplified interface to requests and responses, rather than
  the full WebAuthn spec.

TODO: any more?