// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "../../src/interfaces/IDaimoBridger.sol";

contract DummyBridger is IDaimoBridger {
    IERC20 public expectedTokenIn;
    uint256 public expectedToChainId;
    bytes public expectedExtraData;
    mapping(address => uint256) public bridges;

    constructor(IERC20 tokenIn, uint256 toChainId, bytes memory extraData) {
        expectedTokenIn = tokenIn;
        expectedToChainId = toChainId;
        expectedExtraData = extraData;
    }

    function sendToChain(
        IERC20 tokenIn,
        uint256 amountIn,
        uint256 toChainId,
        bytes calldata extraData
    ) external {
        require(tokenIn == expectedTokenIn, "wrong tokenIn");
        require(toChainId == expectedToChainId, "wrong toChainId");
        require(
            keccak256(extraData) == keccak256(expectedExtraData),
            "wrong extraData"
        );

        bridges[msg.sender] += amountIn;

        tokenIn.transferFrom(msg.sender, address(this), amountIn);
    }
}
