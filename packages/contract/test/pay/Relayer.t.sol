// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

import "../../src/pay/DaimoPayRelayer.sol";
import "../dummy/DaimoDummyUSDC.sol";

contract RelayerTest is Test {
    DaimoPayRelayer public relayer;

    address immutable _owner = 0x2222222222222222222222222222222222222222;
    address immutable _nonOwner = 0x3333333333333333333333333333333333333333;
    address immutable _bob = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;

    IERC20 immutable _token1 = new TestUSDC{salt: bytes32(uint256(1))}();
    IERC20 immutable _token2 = new TestUSDC{salt: bytes32(uint256(2))}();

    function setUp() public {
        relayer = new DaimoPayRelayer(_owner);
    }

    // Helper function to create a sample PayIntent
    function createSampleIntent() internal view returns (PayIntent memory) {
        TokenAmount[] memory bridgeTokenOutOptions = new TokenAmount[](1);
        bridgeTokenOutOptions[0] = TokenAmount(_token1, 100);

        return
            PayIntent({
                toChainId: 1,
                bridgeTokenOutOptions: bridgeTokenOutOptions,
                finalCallToken: TokenAmount(_token1, 100),
                finalCall: Call({to: _bob, value: 0, data: ""}),
                escrow: payable(address(0x6)),
                refundAddress: address(0x7),
                nonce: 1
            });
    }

    function testOnlyOwnerCanStartIntent() public {
        vm.prank(_nonOwner);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                _nonOwner
            )
        );
        relayer.startIntent({
            preCalls: new Call[](0),
            dp: DaimoPay(payable(address(0))),
            intent: createSampleIntent(),
            startCalls: new Call[](0),
            bridgeExtraData: "",
            postCalls: new Call[](0)
        });
    }

    function testOnlyOwnerCanFastFinish() public {
        vm.prank(_nonOwner);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                _nonOwner
            )
        );
        relayer.fastFinish({
            dp: DaimoPay(payable(address(0))),
            intent: createSampleIntent(),
            tokenIn: TokenAmount(_token1, 0),
            calls: new Call[](0)
        });
    }

    function testOnlyOwnerCanClaimAndKeep() public {
        vm.prank(_nonOwner);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                _nonOwner
            )
        );
        relayer.claimAndKeep({
            preCalls: new Call[](0),
            dp: DaimoPay(payable(address(0))),
            intent: createSampleIntent(),
            claimCalls: new Call[](0),
            postCalls: new Call[](0)
        });
    }

    function testOnlyOwnerCanSwapAndTip() public {
        vm.prank(_nonOwner);
        vm.expectRevert("DPR: only usable by owner");
        relayer.swapAndTip({
            requiredTokenIn: TokenAmount(_token1, 0),
            suppliedTokenInAmount: 0,
            requiredTokenOut: TokenAmount(_token1, 0),
            maxTip: 0,
            innerSwap: Call(address(0), 0, "")
        });
    }

    // Test case where relayer tips before the swap to ensure the swap goes
    // through
    function testSwapAndTipPreSwap() public {
        // Setup: send some tokens to owner and bob
        _token1.transfer(_owner, 200);
        _token1.transfer(_bob, 800);

        // Setup: create and give tokens to mock swap contract
        MockSwap mockSwap = new MockSwap(_token1, _token2);
        _token2.transfer(address(mockSwap), 1000);

        // Setup: bob approves relayer contract to spend tokens
        vm.prank(_bob);
        _token1.approve(address(relayer), 800);

        // Setup: owner approves relayer contract to spend tokens
        vm.prank(_owner);
        _token1.approve(address(relayer), 200);

        // bob wants to swap 1000 token1 but only supplies 800
        TokenAmount memory requiredTokenIn = TokenAmount(_token1, 1000);
        uint256 suppliedTokenInAmount = 800;
        TokenAmount memory requiredTokenOut = TokenAmount(_token2, 1000);
        uint256 maxTip = 200;

        // Prepare the inner swap call
        bytes memory swapData = abi.encodeCall(
            MockSwap.swap,
            (1000, 1000) // Swap 1000 token1 for 1000 token2
        );
        Call memory innerSwap = Call(address(mockSwap), 0, swapData);

        // Execute swap where tx.origin is owner and msg.sender is bob
        vm.prank(_bob, _owner);
        relayer.swapAndTip({
            requiredTokenIn: requiredTokenIn,
            suppliedTokenInAmount: suppliedTokenInAmount,
            requiredTokenOut: requiredTokenOut,
            maxTip: maxTip,
            innerSwap: innerSwap
        });

        // Verify results
        // 1. msg.sender should receive exactly the required output amount
        assertEq(_token2.balanceOf(_bob), requiredTokenOut.amount);

        // 2. Owner should have tipped 200 tokenIn (1000 required - 800 supplied)
        assertEq(
            _token1.balanceOf(_owner),
            0 // Initial balance - tip amount
        );
    }

    // Test case where the relayer tips after the swap to ensure the required
    // output amount is received
    function testSwapAndTipPostSwap() public {
        // Setup: send some tokens to owner and bob
        _token2.transfer(_owner, 200);
        _token1.transfer(_bob, 1000);

        // Setup: create and give tokens to mock swap contract
        MockSwap mockSwap = new MockSwap(_token1, _token2);
        _token2.transfer(address(mockSwap), 1000);

        // Setup: bob approves relayer contract to spend tokens
        vm.prank(_bob);
        _token1.approve(address(relayer), 1000);

        // Setup: owner approves relayer contract to spend tokens
        vm.prank(_owner);
        _token2.approve(address(relayer), 200);

        // bob sends 1000 token1 as input and wants to receive 1000 token2
        TokenAmount memory requiredTokenIn = TokenAmount(_token1, 1000);
        uint256 suppliedTokenInAmount = 1000;
        TokenAmount memory requiredTokenOut = TokenAmount(_token2, 1000);
        uint256 maxTip = 200;

        // Prepare the inner swap call
        bytes memory swapData = abi.encodeCall(
            MockSwap.swap,
            (1000, 800) // Swap 1000 token1 for 800 token2
        );
        Call memory innerSwap = Call(address(mockSwap), 0, swapData);

        // Execute swap where tx.origin is owner and msg.sender is bob
        vm.prank(_bob, _owner);
        relayer.swapAndTip({
            requiredTokenIn: requiredTokenIn,
            suppliedTokenInAmount: suppliedTokenInAmount,
            requiredTokenOut: requiredTokenOut,
            maxTip: maxTip,
            innerSwap: innerSwap
        });

        // Verify results
        // 1. msg.sender should receive exactly the required output amount
        assertEq(_token2.balanceOf(_bob), requiredTokenOut.amount);

        // 2. Owner should have tipped 200 tokenOut (1000 required - 800 supplied)
        assertEq(
            _token2.balanceOf(_owner),
            0 // Initial balance - tip amount
        );
    }

    // Test case where required pre-swap tip is too high
    function testSwapAndTipPreSwapExcessiveTip() public {
        // Setup: send some tokens to owner and bob
        _token1.transfer(_owner, 200);
        _token1.transfer(_bob, 700);

        // Setup: create and give tokens to mock swap contract
        MockSwap mockSwap = new MockSwap(_token1, _token2);
        _token2.transfer(address(mockSwap), 1000);

        // Setup: bob approves relayer contract to spend tokens
        vm.prank(_bob);
        _token1.approve(address(relayer), 700);

        // Setup: owner approves relayer contract to spend tokens
        vm.prank(_owner);
        _token1.approve(address(relayer), 200);

        // bob wants to swap 1000 token1 but only supplies 700
        // The owner is only willing to tip 200, but a 1000 - 700 = 300 tip is
        // required to make the swap succeed
        TokenAmount memory requiredTokenIn = TokenAmount(_token1, 1000);
        uint256 suppliedTokenInAmount = 700;
        TokenAmount memory requiredTokenOut = TokenAmount(_token2, 1000);
        uint256 maxTip = 200;

        // Prepare the inner swap call
        bytes memory swapData = abi.encodeCall(
            MockSwap.swap,
            (1000, 1000) // Swap 1000 token1 for 1000 token2
        );
        Call memory innerSwap = Call(address(mockSwap), 0, swapData);

        // Execute swap where tx.origin is owner and msg.sender is bob
        vm.prank(_bob, _owner);
        vm.expectRevert("DPR: excessive tip");
        relayer.swapAndTip({
            requiredTokenIn: requiredTokenIn,
            suppliedTokenInAmount: suppliedTokenInAmount,
            requiredTokenOut: requiredTokenOut,
            maxTip: maxTip,
            innerSwap: innerSwap
        });
    }

    // Test case where required post-swap tip is too high
    function testSwapAndTipPostSwapExcessiveTip() public {
        // Setup: send some tokens to owner and bob
        _token2.transfer(_owner, 200);
        _token1.transfer(_bob, 1000);

        // Setup: create and give tokens to mock swap contract
        MockSwap mockSwap = new MockSwap(_token1, _token2);
        _token2.transfer(address(mockSwap), 1000);

        // Setup: bob approves relayer contract to spend tokens
        vm.prank(_bob);
        _token1.approve(address(relayer), 1000);

        // Setup: owner approves relayer contract to spend tokens
        vm.prank(_owner);
        _token2.approve(address(relayer), 200);

        // bob sends 1000 token1 as input and wants to receive 1000 token2
        TokenAmount memory requiredTokenIn = TokenAmount(_token1, 1000);
        uint256 suppliedTokenInAmount = 1000;
        TokenAmount memory requiredTokenOut = TokenAmount(_token2, 1000);
        uint256 maxTip = 200;

        // The inner swap call only returns 700 token2. owner is only willing
        // to tip 200, but a 1000 - 700 = 300 tip is required
        bytes memory swapData = abi.encodeCall(
            MockSwap.swap,
            (1000, 700) // Swap 1000 token1 for 700 token2
        );
        Call memory innerSwap = Call(address(mockSwap), 0, swapData);

        // Execute swap where tx.origin is owner and msg.sender is bob
        vm.prank(_bob, _owner);
        vm.expectRevert("DPR: excessive tip");
        relayer.swapAndTip({
            requiredTokenIn: requiredTokenIn,
            suppliedTokenInAmount: suppliedTokenInAmount,
            requiredTokenOut: requiredTokenOut,
            maxTip: maxTip,
            innerSwap: innerSwap
        });
    }

    function testExcessOutputGivenToOwner() public {
        // Setup: send some tokens to bob
        _token1.transfer(_bob, 1000);

        // Setup: create and give tokens to mock swap contract
        MockSwap mockSwap = new MockSwap(_token1, _token2);
        _token2.transfer(address(mockSwap), 1100);

        // Setup: bob approves relayer contract to spend tokens
        vm.prank(_bob);
        _token1.approve(address(relayer), 1000);

        // bob sends 1000 token1 as input and wants to receive 1000 token2
        TokenAmount memory requiredTokenIn = TokenAmount(_token1, 1000);
        uint256 suppliedTokenInAmount = 1000;
        TokenAmount memory requiredTokenOut = TokenAmount(_token2, 1000);
        uint256 maxTip = 0;

        // Prepare the inner swap call
        bytes memory swapData = abi.encodeCall(
            MockSwap.swap,
            (1000, 1100) // Swap 1000 token1 for 1100 token2
        );
        Call memory innerSwap = Call(address(mockSwap), 0, swapData);

        // Execute swap where tx.origin is owner and msg.sender is bob
        vm.prank(_bob, _owner);
        relayer.swapAndTip({
            requiredTokenIn: requiredTokenIn,
            suppliedTokenInAmount: suppliedTokenInAmount,
            requiredTokenOut: requiredTokenOut,
            maxTip: maxTip,
            innerSwap: innerSwap
        });

        // Verify results
        // 1. msg.sender should receive exactly the required output amount
        assertEq(_token2.balanceOf(_bob), requiredTokenOut.amount);

        // 2. Owner should receive the excess output 1100 - 1000 = 100
        assertEq(_token2.balanceOf(_owner), 100);
    }
}

// Helper contract which swaps token1 for token2
contract MockSwap {
    IERC20 public token1;
    IERC20 public token2;

    constructor(IERC20 _token1, IERC20 _token2) {
        token1 = _token1;
        token2 = _token2;
    }

    function swap(uint256 amountIn, uint256 amountOut) external {
        token1.transferFrom(msg.sender, address(this), amountIn);
        token2.transfer(msg.sender, amountOut);
    }
}
