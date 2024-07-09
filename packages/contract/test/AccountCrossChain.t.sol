// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "account-abstraction/core/EntryPoint.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";

import "../src/DaimoTestUSDC.sol";
import "../src/DaimoAccountFactoryV2.sol";
import "../src/DaimoAccountV2.sol";

contract AccountCrossChainTest is Test {
    TestUSDC public opUSDCe = new TestUSDC{salt: bytes32(uint256(1))}();
    TestUSDC public opUSDC = new TestUSDC{salt: bytes32(uint256(2))}();
    TestUSDC public baseUSDbC = new TestUSDC{salt: bytes32(uint256(3))}();
    TestUSDC public baseUSDC = new TestUSDC{salt: bytes32(uint256(4))}();

    DummySwapper public swapper =
        new DummySwapper{salt: 0}(opUSDCe, opUSDC, baseUSDbC, baseUSDC);
    DummyBridger public bridger =
        new DummyBridger{salt: 0}(opUSDC, 8453, hex"1234");

    DaimoAccountFactoryV2 public factory;
    DaimoAccountV2 public acc;

    function setUp() public {
        EntryPoint entryPoint = new EntryPoint{salt: 0}();
        factory = new DaimoAccountFactoryV2{salt: 0}(entryPoint);
        acc = factory.createAccount({
            homeChain: 8453,
            homeCoin: baseUSDC,
            swapper: swapper,
            bridger: bridger,
            keySlot: 0,
            key: [bytes32(uint256(1)), bytes32(uint256(2))],
            salt: 0
        });

        // Let DummySwapper send output coins
        opUSDC.transfer(address(swapper), 1e6);
        baseUSDC.transfer(address(swapper), 1e6);

        console.log("entryPoint address:", address(entryPoint));
        console.log("factory address:", address(factory));
        console.log("account address:", address(acc));
        console.log("opUSDCe address:", address(opUSDCe));
        console.log("opUSDC address:", address(opUSDC));
        console.log("baseUSDbC address:", address(baseUSDbC));
        console.log("baseUSDC address:", address(baseUSDC));
    }

    function testCollect() public {
        // Send wrong coin on chain A
        vm.chainId(10);
        opUSDCe.transfer(address(acc), 100);
        assertEq(opUSDCe.balanceOf(address(acc)), 100);

        // Collect (swap + bridge) on home chain = chain B
        acc.collect(opUSDCe, 100, opUSDC, "", hex"1234");

        // Check balances
        assertEq(opUSDCe.balanceOf(address(acc)), 0);
        assertEq(opUSDC.balanceOf(address(acc)), 0);

        // Check that the bridge was started
        assertEq(bridger.bridges(address(acc)), 97);
    }

    function testSwapToCoin() public {
        // Send wrong coin on home chain B
        vm.chainId(8453);
        baseUSDbC.transfer(address(acc), 100);

        // Call swapToHomeCoin() to auto-swap
        acc.swapToHomeCoin(baseUSDbC, 100, "");

        // Check balances
        assertEq(baseUSDbC.balanceOf(address(acc)), 0);
        assertEq(baseUSDC.balanceOf(address(acc)), 97);
    }
}

contract DummySwapper is IDaimoSwapper {
    IERC20 public expectedTokenInA;
    IERC20 public expectedTokenOutA;
    IERC20 public expectedTokenInB;
    IERC20 public expectedTokenOutB;

    constructor(
        IERC20 tokenInA,
        IERC20 tokenOutA,
        IERC20 tokenInB,
        IERC20 tokenOutB
    ) {
        expectedTokenInA = tokenInA;
        expectedTokenOutA = tokenOutA;
        expectedTokenInB = tokenInB;
        expectedTokenOutB = tokenOutB;
    }

    function swapToCoin(
        IERC20 tokenIn,
        uint256 amountIn,
        IERC20 tokenOut,
        bytes calldata extraData
    ) external returns (uint256 amountOut) {
        IERC20 expectedTokenIn;
        IERC20 expectedTokenOut;
        if (block.chainid == 10) {
            expectedTokenIn = expectedTokenInA;
            expectedTokenOut = expectedTokenOutA;
        } else if (block.chainid == 8453) {
            expectedTokenIn = expectedTokenInB;
            expectedTokenOut = expectedTokenOutB;
        } else {
            revert("unsupported chain");
        }

        require(tokenIn == expectedTokenIn, "wrong tokenIn");
        require(tokenOut == expectedTokenOut, "wrong tokenOut");
        require(extraData.length == 0, "wrong extraData");
        tokenIn.transferFrom(msg.sender, address(this), amountIn);

        amountOut = amountIn - 3;
        tokenOut.transfer(msg.sender, amountOut);
    }
}

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