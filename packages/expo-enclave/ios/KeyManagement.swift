import CryptoKit

public class KeyManagement {
    public static func generateKeyPair() -> (privateKey: P256.Signing.PrivateKey, publicKey: P256.Signing.PublicKey) {
        let privateKey = P256.Signing.PrivateKey()
        let publicKey = privateKey.publicKey
        return (privateKey, publicKey)
    }
    
    public static func sign(privateKey: P256.Signing.PrivateKey, data: Data) -> Data {
        let signature = privateKey.signature(for: data)
        return signature.rawRepresentation
    }
    
    public static func verify(publicKey: P256.Signing.PublicKey, data: Data, signature: Data) -> Bool {
        let signature = P256.Signing.ECDSASignature(rawRepresentation: signature)
        return publicKey.isValidSignature(signature, for: data)
    }
}