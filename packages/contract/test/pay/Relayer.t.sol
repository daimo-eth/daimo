// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

import "../../src/pay/DaimoPayRelayer.sol";
import "../dummy/DaimoDummyUSDC.sol";

contract RelayerTest is Test {
    DaimoPayRelayer public relayerContract;
    MockDaimoPay public mockDp;
    MockSwap public mockSwap;

    address immutable _admin = 0x2222222222222222222222222222222222222222;
    address immutable _relayer = 0x3333333333333333333333333333333333333333;
    address immutable _noRole = 0x4444444444444444444444444444444444444444;
    address immutable _bob = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;

    IERC20 immutable _token1 = new TestUSDC{salt: bytes32(uint256(1))}();
    IERC20 immutable _token2 = new TestUSDC{salt: bytes32(uint256(2))}();

    function setUp() public {
        relayerContract = new DaimoPayRelayer(_admin);
        mockDp = new MockDaimoPay(
            PayIntentFactory(address(0)),
            DaimoPayBridger(address(0))
        );
        mockSwap = new MockSwap(_token1, _token2);

        vm.startPrank(_admin);
        relayerContract.grantRelayerEOARole(_relayer);
        vm.stopPrank();

        // Give tokens to mockSwap for swap output
        _token2.transfer(address(mockSwap), 1000);
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
                escrow: payable(address(mockDp)),
                refundAddress: address(_bob),
                nonce: 1
            });
    }

    function testOnlyRelayerRoleCanStartIntent() public {
        vm.startPrank(_noRole);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                _noRole,
                relayerContract.RELAYER_EOA_ROLE()
            )
        );
        relayerContract.startIntent({
            preCalls: new Call[](0),
            dp: DaimoPay(payable(address(mockDp))),
            intent: createSampleIntent(),
            startCalls: new Call[](0),
            bridgeExtraData: "",
            postCalls: new Call[](0)
        });
        vm.stopPrank();

        vm.startPrank(_relayer);
        relayerContract.startIntent({
            preCalls: new Call[](0),
            dp: DaimoPay(payable(address(mockDp))),
            intent: createSampleIntent(),
            startCalls: new Call[](0),
            bridgeExtraData: "",
            postCalls: new Call[](0)
        });
        vm.stopPrank();
    }

    function testOnlyRelayerRoleCanFastFinish() public {
        vm.startPrank(_noRole);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                _noRole,
                relayerContract.RELAYER_EOA_ROLE()
            )
        );
        relayerContract.fastFinish({
            dp: DaimoPay(payable(address(0))),
            intent: createSampleIntent(),
            tokenIn: TokenAmount(_token1, 0),
            calls: new Call[](0)
        });
        vm.stopPrank();

        vm.startPrank(_relayer);
        relayerContract.fastFinish({
            dp: DaimoPay(payable(address(mockDp))),
            intent: createSampleIntent(),
            tokenIn: TokenAmount(_token1, 0),
            calls: new Call[](0)
        });
        vm.stopPrank();
    }

    function testOnlyRelayerRoleCanClaimAndKeep() public {
        vm.startPrank(_noRole);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                _noRole,
                relayerContract.RELAYER_EOA_ROLE()
            )
        );
        relayerContract.claimAndKeep({
            preCalls: new Call[](0),
            dp: DaimoPay(payable(address(0))),
            intent: createSampleIntent(),
            claimCalls: new Call[](0),
            postCalls: new Call[](0)
        });
        vm.stopPrank();

        vm.startPrank(_relayer);
        relayerContract.claimAndKeep({
            preCalls: new Call[](0),
            dp: DaimoPay(payable(address(mockDp))),
            intent: createSampleIntent(),
            claimCalls: new Call[](0),
            postCalls: new Call[](0)
        });
        vm.stopPrank();
    }

    function testOnlyAdminCanGrantRelayerEOARole() public {
        vm.startPrank(_noRole);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                _noRole,
                relayerContract.DEFAULT_ADMIN_ROLE()
            )
        );
        relayerContract.grantRelayerEOARole(_relayer);
        vm.stopPrank();

        vm.startPrank(_relayer);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                _relayer,
                relayerContract.DEFAULT_ADMIN_ROLE()
            )
        );
        relayerContract.grantRelayerEOARole(_relayer);
        vm.stopPrank();

        vm.startPrank(_admin);
        relayerContract.grantRelayerEOARole(_relayer);
        vm.stopPrank();
    }

    function testOnlyAdminCanWithdrawAmount() public {
        _token1.transfer(address(relayerContract), 1000);

        vm.startPrank(_noRole);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                _noRole,
                relayerContract.DEFAULT_ADMIN_ROLE()
            )
        );
        relayerContract.withdrawAmount(_token1, 100);
        vm.stopPrank();

        vm.startPrank(_relayer);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                _relayer,
                relayerContract.DEFAULT_ADMIN_ROLE()
            )
        );
        relayerContract.withdrawAmount(_token1, 100);
        vm.stopPrank();

        vm.startPrank(_admin);
        relayerContract.withdrawAmount(_token1, 100);
        vm.stopPrank();
    }

    function testOnlyAdminCanWithdrawBalance() public {
        _token1.transfer(address(relayerContract), 1000);

        vm.startPrank(_noRole);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                _noRole,
                relayerContract.DEFAULT_ADMIN_ROLE()
            )
        );
        relayerContract.withdrawBalance(_token1);
        vm.stopPrank();

        vm.startPrank(_relayer);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                _relayer,
                relayerContract.DEFAULT_ADMIN_ROLE()
            )
        );
        relayerContract.withdrawBalance(_token1);
        vm.stopPrank();

        vm.startPrank(_admin);
        relayerContract.withdrawBalance(_token1);
        vm.stopPrank();
    }

    function testWithdrawAmountERC20() public {
        _token1.transfer(address(relayerContract), 1000);

        vm.startPrank(_admin);
        relayerContract.withdrawAmount(_token1, 100);
        vm.stopPrank();

        assertEq(_token1.balanceOf(_admin), 100);
    }

    function testWithdrawAmountNative() public {
        vm.deal(address(relayerContract), 1000);

        vm.startPrank(_admin);
        relayerContract.withdrawAmount(IERC20(address(0)), 100);
        vm.stopPrank();

        assertEq(address(_admin).balance, 100);
    }

    function testWithdrawBalance() public {
        _token1.transfer(address(relayerContract), 1000);

        vm.startPrank(_admin);
        uint256 withdrawnAmount = relayerContract.withdrawBalance(_token1);
        vm.stopPrank();

        assertEq(_token1.balanceOf(_admin), 1000);
        assertEq(withdrawnAmount, 1000);
    }

    function testWithdrawBalanceNative() public {
        vm.deal(address(relayerContract), 1000);

        vm.startPrank(_admin);
        uint256 withdrawnAmount = relayerContract.withdrawBalance(
            IERC20(address(0))
        );
        vm.stopPrank();

        assertEq(address(_admin).balance, 1000);
        assertEq(withdrawnAmount, 1000);
    }

    function testNonRelayerCannotSwapAndTip() public {
        // msg.sender is _noRole, tx.origin is _noRole
        vm.startPrank(_noRole, _noRole);
        vm.expectRevert("DPR: only relayer");
        relayerContract.swapAndTip({
            requiredTokenIn: TokenAmount(_token1, 0),
            suppliedTokenInAmount: 0,
            requiredTokenOut: TokenAmount(_token1, 0),
            maxPreTip: 0,
            maxPostTip: 0,
            innerSwap: Call(address(0), 0, "")
        });
        vm.stopPrank();

        // msg.sender is _relayer, tx.origin is _noRole
        // This should revert because swapAndTip requires tx.origin to have the
        // RELAYER_EOA_ROLE.
        vm.startPrank(_relayer, _noRole);
        vm.expectRevert("DPR: only relayer");
        relayerContract.swapAndTip({
            requiredTokenIn: TokenAmount(_token1, 0),
            suppliedTokenInAmount: 0,
            requiredTokenOut: TokenAmount(_token1, 0),
            maxPreTip: 0,
            maxPostTip: 0,
            innerSwap: Call(address(0), 0, "")
        });
        vm.stopPrank();
    }

    // Test case where relayer tips before the swap to ensure the swap goes
    // through
    function testSwapAndTipPreSwap() public {
        // Setup: send tokens to relayerContract for tipping
        _token1.transfer(address(relayerContract), 200);

        // Setup: send tokens to bob for providing swap input
        _token1.transfer(_bob, 800);

        // Setup: bob approves relayer contract to spend tokens for swap
        vm.startPrank(_bob);
        _token1.approve(address(relayerContract), 800);
        vm.stopPrank();

        // bob wants to swap 1000 token1 but only supplies 800
        TokenAmount memory requiredTokenIn = TokenAmount(_token1, 1000);
        uint256 suppliedTokenInAmount = 800;
        TokenAmount memory requiredTokenOut = TokenAmount(_token2, 1000);
        uint256 maxPreTip = 200;
        uint256 maxPostTip = 0;

        // Prepare the inner swap call
        bytes memory swapData = abi.encodeCall(
            MockSwap.swap,
            (1000, 1000) // Swap 1000 token1 for 1000 token2
        );
        Call memory innerSwap = Call(address(mockSwap), 0, swapData);

        // Execute swap where tx.origin is relayer and msg.sender is bob
        vm.startPrank(_bob, _relayer);
        vm.expectEmit(address(relayerContract));
        emit DaimoPayRelayer.SwapAndTip({
            requiredTokenIn: address(requiredTokenIn.token),
            suppliedAmountIn: suppliedTokenInAmount,
            requiredTokenOut: address(requiredTokenOut.token),
            swapAmountOut: 1000, // we know mockSwap returns 1000 tokens
            maxPreTip: 200, // preTip = 1000 required - 800 supplied
            maxPostTip: 0
        });
        relayerContract.swapAndTip({
            requiredTokenIn: requiredTokenIn,
            suppliedTokenInAmount: suppliedTokenInAmount,
            requiredTokenOut: requiredTokenOut,
            maxPreTip: maxPreTip,
            maxPostTip: maxPostTip,
            innerSwap: innerSwap
        });
        vm.stopPrank();

        // Verify results
        // 1. msg.sender should receive exactly the required output amount
        assertEq(_token2.balanceOf(_bob), requiredTokenOut.amount);

        // 2. Contract should have tipped 200 tokenIn (1000 required - 800 supplied)
        assertEq(
            _token1.balanceOf(address(relayerContract)),
            0 // Initial balance - tip amount
        );
    }

    // Test case where the relayer tips after the swap to ensure the required
    // output amount is received
    function testSwapAndTipPostSwap() public {
        // Setup: send tokens to relayerContract for tipping
        _token2.transfer(address(relayerContract), 200);

        // Setup: send tokens to bob for providing swap input
        _token1.transfer(_bob, 1000);

        // Setup: bob approves relayer contract to spend tokens for swap
        vm.startPrank(_bob);
        _token1.approve(address(relayerContract), 1000);
        vm.stopPrank();

        // bob sends 1000 token1 as input and wants to receive 1000 token2
        TokenAmount memory requiredTokenIn = TokenAmount(_token1, 1000);
        uint256 suppliedTokenInAmount = 1000;
        TokenAmount memory requiredTokenOut = TokenAmount(_token2, 1000);
        uint256 maxPreTip = 0;
        uint256 maxPostTip = 200;

        // Prepare the inner swap call
        bytes memory swapData = abi.encodeCall(
            MockSwap.swap,
            (1000, 800) // Swap 1000 token1 for 800 token2
        );
        Call memory innerSwap = Call(address(mockSwap), 0, swapData);

        // Execute swap where tx.origin is relayer and msg.sender is bob
        vm.startPrank(_bob, _relayer);
        vm.expectEmit(address(relayerContract));
        emit DaimoPayRelayer.SwapAndTip({
            requiredTokenIn: address(requiredTokenIn.token),
            suppliedAmountIn: suppliedTokenInAmount,
            requiredTokenOut: address(requiredTokenOut.token),
            swapAmountOut: 800, // we know mockSwap returns 800 tokens
            maxPreTip: 0,
            maxPostTip: 200 // postTip = 1000 required - 800 swap output
        });
        relayerContract.swapAndTip({
            requiredTokenIn: requiredTokenIn,
            suppliedTokenInAmount: suppliedTokenInAmount,
            requiredTokenOut: requiredTokenOut,
            maxPreTip: maxPreTip,
            maxPostTip: maxPostTip,
            innerSwap: innerSwap
        });
        vm.stopPrank();

        // Verify results
        // 1. msg.sender should receive exactly the required output amount
        assertEq(_token2.balanceOf(_bob), requiredTokenOut.amount);

        // 2. Owner should have tipped 200 tokenOut (1000 required - 800 supplied)
        assertEq(
            _token2.balanceOf(address(relayerContract)),
            0 // Initial balance - tip amount
        );
    }

    // Test case where required pre-swap tip is too high
    function testSwapAndTipPreSwapExcessiveTip() public {
        // Setup: send some tokens to relayerContract for tipping
        _token1.transfer(address(relayerContract), 200);

        // Setup: send tokens to bob for providing swap input
        _token1.transfer(_bob, 700);

        // Setup: bob approves relayer contract to spend tokens for swap
        vm.startPrank(_bob);
        _token1.approve(address(relayerContract), 700);
        vm.stopPrank();

        // bob wants to swap 1000 token1 but only supplies 700
        // The owner is willing to tip 200, but a 1000 - 700 = 300 tip is
        // required to make the swap succeed
        TokenAmount memory requiredTokenIn = TokenAmount(_token1, 1000);
        uint256 suppliedTokenInAmount = 700;
        TokenAmount memory requiredTokenOut = TokenAmount(_token2, 1000);
        uint256 maxPreTip = 200;
        uint256 maxPostTip = 0;

        // Prepare the inner swap call
        bytes memory swapData = abi.encodeCall(
            MockSwap.swap,
            (1000, 1000) // Swap 1000 token1 for 1000 token2
        );
        Call memory innerSwap = Call(address(mockSwap), 0, swapData);

        // Execute swap where tx.origin is relayer and msg.sender is bob
        vm.startPrank(_bob, _relayer);
        vm.expectRevert("DPR: excessive pre tip");
        relayerContract.swapAndTip({
            requiredTokenIn: requiredTokenIn,
            suppliedTokenInAmount: suppliedTokenInAmount,
            requiredTokenOut: requiredTokenOut,
            maxPreTip: maxPreTip,
            maxPostTip: maxPostTip,
            innerSwap: innerSwap
        });
        vm.stopPrank();
    }

    // Test case where required post-swap tip is too high
    function testSwapAndTipPostSwapExcessiveTip() public {
        // Setup: send some tokens to relayerContract for tipping
        _token2.transfer(address(relayerContract), 200);

        // Setup: send tokens to bob for providing swap input
        _token1.transfer(_bob, 1000);

        // Setup: bob approves relayer contract to spend tokens for swap
        vm.startPrank(_bob);
        _token1.approve(address(relayerContract), 1000);
        vm.stopPrank();

        // bob sends 1000 token1 as input and wants to receive 1000 token2
        TokenAmount memory requiredTokenIn = TokenAmount(_token1, 1000);
        uint256 suppliedTokenInAmount = 1000;
        TokenAmount memory requiredTokenOut = TokenAmount(_token2, 1000);
        uint256 maxPreTip = 0;
        uint256 maxPostTip = 200;

        // The inner swap call only returns 700 token2. owner is willing
        // to tip 200, but a 1000 - 700 = 300 tip is required
        bytes memory swapData = abi.encodeCall(
            MockSwap.swap,
            (1000, 700) // Swap 1000 token1 for 700 token2
        );
        Call memory innerSwap = Call(address(mockSwap), 0, swapData);

        // Execute swap where tx.origin is relayer and msg.sender is bob
        vm.startPrank(_bob, _relayer);
        vm.expectRevert("DPR: excessive post tip");
        relayerContract.swapAndTip({
            requiredTokenIn: requiredTokenIn,
            suppliedTokenInAmount: suppliedTokenInAmount,
            requiredTokenOut: requiredTokenOut,
            maxPreTip: maxPreTip,
            maxPostTip: maxPostTip,
            innerSwap: innerSwap
        });
        vm.stopPrank();
    }

    function testExcessOutputKeptByContract() public {
        // Setup: send some tokens to bob
        _token1.transfer(_bob, 1000);

        // Setup: bob approves relayer contract to spend tokens for swap
        vm.startPrank(_bob);
        _token1.approve(address(relayerContract), 1000);
        vm.stopPrank();

        // bob sends 1000 token1 as input and wants to receive 900 token2
        TokenAmount memory requiredTokenIn = TokenAmount(_token1, 1000);
        uint256 suppliedTokenInAmount = 1000;
        TokenAmount memory requiredTokenOut = TokenAmount(_token2, 900);
        uint256 maxPreTip = 0;
        uint256 maxPostTip = 0;

        // Prepare the inner swap call
        bytes memory swapData = abi.encodeCall(
            MockSwap.swap,
            (1000, 1000) // Swap 1000 token1 for 1000 token2
        );
        Call memory innerSwap = Call(address(mockSwap), 0, swapData);

        // Execute swap where tx.origin is relayer and msg.sender is bob
        vm.startPrank(_bob, _relayer);
        relayerContract.swapAndTip({
            requiredTokenIn: requiredTokenIn,
            suppliedTokenInAmount: suppliedTokenInAmount,
            requiredTokenOut: requiredTokenOut,
            maxPreTip: maxPreTip,
            maxPostTip: maxPostTip,
            innerSwap: innerSwap
        });
        vm.stopPrank();

        // Verify results
        // 1. msg.sender should receive exactly the required output amount
        assertEq(_token2.balanceOf(_bob), requiredTokenOut.amount);

        // 2. Contract should receive the excess output 1000 - 900 = 100
        assertEq(_token2.balanceOf(address(relayerContract)), 100);
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

contract MockDaimoPay {
    constructor(PayIntentFactory _intentFactory, DaimoPayBridger _bridger) {}

    function startIntent(
        PayIntent calldata intent,
        Call[] calldata calls,
        bytes calldata bridgeExtraData
    ) public {}

    function fastFinishIntent(
        PayIntent calldata intent,
        Call[] calldata calls
    ) public {}

    function claimIntent(
        PayIntent calldata intent,
        Call[] calldata calls
    ) public {}
}
