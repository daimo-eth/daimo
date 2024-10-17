// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/utils/Create2.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./PayIntent.sol";

contract PayIntentFactory {
    PayIntentContract public immutable intentImpl;

    constructor() {
        intentImpl = new PayIntentContract();
    }

    function createIntent(
        PayIntent calldata intent
    ) public returns (PayIntentContract ret) {
        ret = PayIntentContract(
            payable(
                address(
                    new ERC1967Proxy{salt: bytes32(0)}(
                        address(intentImpl),
                        abi.encodeCall(
                            PayIntentContract.initialize,
                            (calcIntentHash(intent))
                        )
                    )
                )
            )
        );
    }

    function getIntentAddress(
        PayIntent calldata intent
    ) public view returns (address) {
        return
            Create2.computeAddress(
                0,
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(
                            address(intentImpl),
                            abi.encodeCall(
                                PayIntentContract.initialize,
                                (calcIntentHash(intent))
                            )
                        )
                    )
                )
            );
    }
}
