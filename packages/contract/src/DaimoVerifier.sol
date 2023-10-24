// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/proxy/utils/UUPSUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "p256-verifier/WebAuthn.sol";

/// Proxy using the UUPSUpgradeable pattern. Named for Etherscan verification.
contract DaimoVerifierProxy is ERC1967Proxy {
    constructor(
        address _logic,
        bytes memory _data
    ) ERC1967Proxy(_logic, _data) {}
}

struct Signature {
    bytes authenticatorData;
    string clientDataJSON;
    uint256 challengeLocation;
    uint256 responseTypeLocation;
    uint256 r;
    uint256 s;
}

// Proxies a signature verification call to the Webauthn library.
// This contract exists only to enable upgradability of the Webauthn
// library that is in control of the owner rather than account.
// Stateless, upgradeable, ownable.
contract DaimoVerifier is OwnableUpgradeable, UUPSUpgradeable {
    constructor() {
        _disableInitializers();
    }

    /// On proxy deployment, deployer becomes the owner.
    function init() public initializer {
        __Ownable_init();
    }

    /// UUPSUpsgradeable: only allow owner to upgrade
    function _authorizeUpgrade(
        address newImplementation
    ) internal view override onlyOwner {
        (newImplementation); // No-op; silence unused parameter warning
    }

    /// UUPSUpgradeable: expose implementation
    function implementation() public view returns (address) {
        return _getImplementation();
    }

    function verifySignature(
        bytes memory message,
        bytes calldata signature,
        uint256 x,
        uint256 y
    ) public view returns (bool) {
        Signature memory sig = abi.decode(signature[1:], (Signature));

        return
            WebAuthn.verifySignature({
                challenge: message,
                authenticatorData: sig.authenticatorData,
                requireUserVerification: false,
                clientDataJSON: sig.clientDataJSON,
                challengeLocation: sig.challengeLocation,
                responseTypeLocation: sig.responseTypeLocation,
                r: sig.r,
                s: sig.s,
                x: x,
                y: y
            });
    }
}
