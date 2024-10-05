// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/utils/Create2.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./CrepeHandoff.sol";

contract CrepeHandoffFactory {
    CrepeHandoff public immutable handoffImplementation;

    constructor() {
        handoffImplementation = new CrepeHandoff();
    }

    function createHandoff(
        address payable creator,
        Destination calldata destination
    ) public returns (CrepeHandoff ret) {
        ret = CrepeHandoff(
            payable(
                address(
                    new ERC1967Proxy{salt: bytes32(0)}(
                        address(handoffImplementation),
                        abi.encodeCall(
                            CrepeHandoff.initialize,
                            (creator, destination)
                        )
                    )
                )
            )
        );
    }

    function getHandoffAddress(
        address payable creator,
        Destination calldata destination
    ) public view returns (address) {
        return
            Create2.computeAddress(
                0,
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(
                            address(handoffImplementation),
                            abi.encodeCall(
                                CrepeHandoff.initialize,
                                (creator, destination)
                            )
                        )
                    )
                )
            );
    }
}
