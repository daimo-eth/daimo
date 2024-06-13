// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "p256-verifier/utils/Base64URL.sol";
import "../src/DaimoAccountV2.sol";

library Utils {
    function rawSignatureToSignature(
        bytes memory challenge,
        uint256 r,
        uint256 s
    ) public view returns (DaimoAccountV2.Signature memory) {
        string memory challengeb64url = Base64URL.encode(challenge);
        string memory clientDataJSON = string(
            abi.encodePacked(
                '{"type":"webauthn.get","challenge":"',
                challengeb64url,
                '","origin":"https://daimo.xyz"}'
            )
        );
        console2.log("clientDataJSON:", clientDataJSON);

        bytes memory authenticatorData = new bytes(37);
        authenticatorData[32] = bytes1(0x05); // flags: user present, user verified

        return
            DaimoAccountV2.Signature({
                keySlot: 0,
                authenticatorData: authenticatorData,
                clientDataJSON: clientDataJSON,
                r: r,
                s: s
            });
    }
}
