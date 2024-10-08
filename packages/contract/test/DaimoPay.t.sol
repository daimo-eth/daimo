// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";
import "account-abstraction/core/EntryPoint.sol";

import "../src/pay/DaimoPay.sol";
import "../src/pay/DaimoPayBridger.sol";
import "../src/pay/DaimoPayCCTPBridger.sol";
import "../src/pay/DaimoPayAcrossBridger.sol";
import "./dummy/DaimoDummyUSDC.sol";

address constant BASE_INTENT_ADDR = 0xc6D5137fB8B670Fa460EB4D1160fb0D46e6a1F04;
address constant LINEA_INTENT_ADDR = 0x24A66b6ea9f3BADe72e129DB613c7066CB3c01dE;

contract DaimoPayTest is Test {
    // Daimo Pay contracts
    DaimoPay public dp;
    PayIntentFactory public intentFactory;

    // Bridging contracts
    DaimoPayBridger public bridger;
    DaimoPayCCTPBridger public cctpBridger;
    DaimoPayAcrossBridger public acrossBridger;

    // CCTP dummy contracts
    DummyTokenMinter public tokenMinter;
    DummyCCTPMessenger public messenger;

    // Across dummy contracts
    DummySpokePool public spokePool;

    uint256 immutable _fromChainId = 10; // Optimism
    address immutable _alice = 0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa;
    IERC20 immutable _fromToken = new TestUSDC{salt: bytes32(uint256(1))}();
    uint256 immutable _baseChainId = 8453; // Base
    uint32 immutable _baseDomain = 6; // Base
    uint256 immutable _lineaChainId = 59144; // Linea
    address immutable _bob = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;
    IERC20 immutable _toToken = new TestUSDC{salt: bytes32(uint256(2))}();
    uint256 immutable _toAmount = 100;
    uint256 immutable _nonce = 1;

    address immutable _lp = 0x2222222222222222222222222222222222222222;
    uint256 immutable _lpToTokenInitBalance = 1000;

    function setUp() public {
        intentFactory = new PayIntentFactory();

        // Initialize CCTP bridger
        tokenMinter = new DummyTokenMinter();
        // Set up token mappings
        tokenMinter.setLocalToken(
            _baseDomain,
            bytes32(uint256(uint160(address(_toToken)))),
            address(_fromToken)
        );
        messenger = new DummyCCTPMessenger(address(_fromToken));
        cctpBridger = new DaimoPayCCTPBridger(
            address(this),
            tokenMinter,
            messenger
        );
        cctpBridger.addCCTPDomain(_baseChainId, _baseDomain);

        // Initialize Across bridger
        spokePool = new DummySpokePool(address(_fromToken), address(_toToken));
        acrossBridger = new DaimoPayAcrossBridger(
            address(this),
            spokePool,
            1e16 // 1% fee
        );
        acrossBridger.addTokenPair(
            _lineaChainId,
            address(_toToken),
            address(_fromToken)
        );

        bridger = new DaimoPayBridger(address(this));

        // Map _baseChainId to cctpBridger and _lineaChainId to acrossBridger
        uint256[] memory chainIds = new uint256[](2);
        chainIds[0] = _baseChainId;
        chainIds[1] = _lineaChainId;
        IDaimoPayBridger[] memory bridgers = new IDaimoPayBridger[](2);
        bridgers[0] = cctpBridger;
        bridgers[1] = acrossBridger;
        bridger.init(chainIds, bridgers);

        dp = new DaimoPay(intentFactory, bridger);

        // Log addresses of initialized contracts
        console.log("PayIntentFactory address:", address(intentFactory));
        console.log("DummyTokenMinter address:", address(tokenMinter));
        console.log("DummyCCTPMessenger address:", address(messenger));
        console.log("DaimoPayCCTPBridger address:", address(cctpBridger));
        console.log("DaimoPayBridger address:", address(bridger));
        console.log("DaimoPay address:", address(dp));
        console.log("TestUSDC (fromToken) address:", address(_fromToken));
        console.log("TestUSDC (toToken) address:", address(_toToken));
    }

    function testGetHandoffAddr() public view {
        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        address actual = intentFactory.getIntentAddress(intent);
        console.log("actual intent addr:", actual);

        assertEq(actual, BASE_INTENT_ADDR);
    }

    // Test that startAction reverts when the intent is on the same chain.
    // Simple = no swap, no finalCall
    function testSimpleSameChainStart() public {
        vm.chainId(_fromChainId);

        // Give Alice some native token
        vm.deal(_alice, 555);

        // Alice initiates a transfer
        vm.startPrank(_alice);

        // Create a payment intent which specifies the native token
        // The 0 address is used to specify native token
        PayIntent memory intent = PayIntent({
            toChainId: _fromChainId,
            bridgeTokenOut: TokenAmount({
                addr: IERC20(address(0)),
                amount: _toAmount
            }),
            finalCallToken: TokenAmount({
                addr: IERC20(address(0)),
                amount: _toAmount
            }),
            finalCall: Call({to: _bob, value: _toAmount, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // Alice sends some native token to the intent address
        address intentAddr = intentFactory.getIntentAddress(intent);
        (bool success, ) = intentAddr.call{value: 100}("");
        require(success, "Failed to send native token to intent address");

        vm.expectRevert();
        dp.startAction({
            intent: intent,
            calls: new Call[](0),
            bridgeExtraData: ""
        });

        vm.stopPrank();
    }

    // Test a simple startAction call that bridges using CCTP.
    // Simple = no pre-swap, no post-call.
    function testSimpleCCTPStart() public {
        vm.chainId(_fromChainId);

        // Give Alice some coins
        _fromToken.transfer(_alice, 555);

        // Alice initiates a transfer
        vm.startPrank(_alice);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // Alice sends some coins to the intent address
        address intentAddr = intentFactory.getIntentAddress(intent);
        _fromToken.transfer(intentAddr, _toAmount);

        vm.expectEmit(address(cctpBridger));
        emit IDaimoPayBridger.BridgeInitiated(
            _baseChainId,
            BASE_INTENT_ADDR,
            address(_toToken),
            _toAmount,
            address(_fromToken),
            _toAmount
        );
        vm.expectEmit(address(dp));
        emit DaimoPay.Start(BASE_INTENT_ADDR, intent);

        uint256 gasBefore = gasleft();
        dp.startAction({
            intent: intent,
            calls: new Call[](0),
            bridgeExtraData: ""
        });
        uint256 gasAfter = gasleft();

        console.log("gas used", gasBefore - gasAfter);

        vm.stopPrank();

        assertEq(dp.intentSent(intentAddr), true, "intent not sent");
        // Check that the CCTP messenger burned tokens
        assertEq(
            messenger.amountBurned(),
            _toAmount,
            "incorrect CCTP amount burned"
        );
        // Check that the Across bridger did not receive tokens
        assertEq(
            spokePool.totalInputAmount(),
            0,
            "incorrect Across amount received"
        );
    }

    // Test a simple startAction call that bridges using Across.
    // Simple = no pre-swap, no post-call.
    function testSimpleAcrossStart() public {
        vm.chainId(_fromChainId);

        // Give Alice some coins
        _fromToken.transfer(_alice, 555);

        // Alice initiates a transfer
        vm.startPrank(_alice);

        PayIntent memory intent = PayIntent({
            toChainId: _lineaChainId,
            bridgeTokenOut: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // Create the ExtraData struct for Across bridging
        DaimoPayAcrossBridger.ExtraData memory extraData = DaimoPayAcrossBridger
            .ExtraData({
                exclusiveRelayer: address(0),
                quoteTimestamp: uint32(block.timestamp),
                fillDeadline: uint32(block.timestamp + 1 hours),
                exclusivityDeadline: 0,
                message: "gm ser"
            });

        // Alice sends some coins to the intent address. The Across bridger
        // expects at least a 1% fee. Send more than enough for the 1% fee.
        uint256 inputAmount = 105;
        address intentAddr = intentFactory.getIntentAddress(intent);
        _fromToken.transfer(intentAddr, inputAmount);

        uint256 expectedInputAmount = 101; // _toAmount with 1% fee

        vm.expectEmit(address(acrossBridger));
        emit IDaimoPayBridger.BridgeInitiated(
            _lineaChainId,
            LINEA_INTENT_ADDR,
            address(_toToken),
            _toAmount,
            address(_fromToken),
            expectedInputAmount
        );
        vm.expectEmit(address(dp));
        emit DaimoPay.Start(LINEA_INTENT_ADDR, intent);

        uint256 gasBefore = gasleft();
        dp.startAction({
            intent: intent,
            calls: new Call[](0),
            bridgeExtraData: abi.encode(extraData)
        });
        uint256 gasAfter = gasleft();

        console.log("gas used", gasBefore - gasAfter);

        vm.stopPrank();

        assertEq(dp.intentSent(intentAddr), true, "intent not sent");
        // Check that the Across bridger received tokens
        assertEq(
            spokePool.totalInputAmount(),
            expectedInputAmount,
            "incorrect Across amount received"
        );
        // Check that the CCTP messenger didn't burned tokens
        assertEq(messenger.amountBurned(), 0, "incorrect CCTP amount burned");
    }

    // Test that a simple fastFinishAction completes successfully.
    // Simple = no swap, no finalCall, just a transfer to the recipient.
    function testSimpleFastFinish() public {
        vm.chainId(_baseChainId);

        // Seed the LP with an initial balance
        _toToken.transfer(_lp, _lpToTokenInitBalance);

        // Immediately after Alice's tx confirms, LP sends to Bob
        vm.startPrank(_lp);
        _toToken.approve(address(dp), _toAmount);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        vm.expectEmit(address(dp));
        emit DaimoPay.ActionCompleted(BASE_INTENT_ADDR, _bob);
        vm.expectEmit(address(dp));
        emit DaimoPay.FastFinish(BASE_INTENT_ADDR, _lp, intent);

        dp.fastFinishAction({intent: intent, calls: new Call[](0)});

        vm.stopPrank();

        // LP sent funds to the recipient
        assertEq(_toToken.balanceOf(_lp), _lpToTokenInitBalance - _toAmount);
        assertEq(_toToken.balanceOf(_bob), _toAmount);
    }

    // Test that the LP can claim the funds after the bridged funds arrive.
    function testSimpleLPClaim() public {
        testSimpleFastFinish();

        // Wait for CCTP to relay the message
        vm.warp(block.timestamp + 20 minutes);

        // CCTP receiveMessage() sends funds to the handoff address
        _toToken.transfer(BASE_INTENT_ADDR, _toAmount);

        // Then, LP claims the funds
        vm.prank(_lp);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        vm.expectEmit(address(dp));
        emit DaimoPay.Claim(BASE_INTENT_ADDR, _lp, intent);

        dp.claimAction({intent: intent, calls: new Call[](0)});

        // LP received funds from handoff, and handoff is destroyed
        assertEq(_toToken.balanceOf(BASE_INTENT_ADDR), 0);
        assertEq(_toToken.balanceOf(_lp), _lpToTokenInitBalance);
        assertEq(_toToken.balanceOf(_bob), _toAmount);
    }

    // Test that the funds are sent to the final recipient if no LP claims.
    function testClaimWithoutFastFinish() public {
        vm.chainId(_baseChainId);

        // Wait for CCTP to relay the message
        vm.warp(block.timestamp + 20 minutes);

        // CCTP receiveMessage() sends funds to the handoff address
        _toToken.transfer(BASE_INTENT_ADDR, _toAmount);

        // Then, a third party calls claimAction
        vm.prank(_lp);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        vm.expectEmit(address(dp));
        emit DaimoPay.Claim(BASE_INTENT_ADDR, _bob, intent);

        dp.claimAction({intent: intent, calls: new Call[](0)});

        // LP doesn't receive funds, handoff is destroyed, and funds are sent
        // to the final recipient
        assertEq(_toToken.balanceOf(BASE_INTENT_ADDR), 0);
        assertEq(_toToken.balanceOf(_lp), 0);
        assertEq(_toToken.balanceOf(_bob), _toAmount);
    }

    // Test that the contract reverts when the fromToken doesn't match the
    // localToken returned by the CCTP TokenMinter.
    function testCCTPFromAndToTokenMismatch() public {
        vm.chainId(_fromChainId);

        // Deploy a new token that's not registered by the token minter
        IERC20 newToken = new TestUSDC{salt: bytes32(uint256(420))}();

        // Give Alice some coins
        newToken.transfer(_alice, 555);

        // Alice initiates a transfer
        vm.startPrank(_alice);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // Alice sends some coins to the intent address
        address intentAddr = intentFactory.getIntentAddress(intent);
        newToken.transfer(intentAddr, _toAmount);

        // Expect revert due to token mismatch
        vm.expectRevert();
        dp.startAction({
            intent: intent,
            calls: new Call[](0),
            bridgeExtraData: ""
        });
        vm.stopPrank();
    }

    // Test that the contract reverts when the fromToken doesn't match the
    // inputToken stored in the DaimoPayAcrossBridger.
    function testAcrossFromAndToTokenMismatch() public {
        vm.chainId(_fromChainId);

        // Deploy a new token that's not registered by the DaimoPayAcrossBridger
        IERC20 newToken = new TestUSDC{salt: bytes32(uint256(420))}();

        // Give Alice some coins
        newToken.transfer(_alice, 555);

        // Alice initiates a transfer
        vm.startPrank(_alice);

        PayIntent memory intent = PayIntent({
            toChainId: _lineaChainId,
            bridgeTokenOut: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({addr: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // Alice sends some coins to the intent address
        address intentAddr = intentFactory.getIntentAddress(intent);
        newToken.transfer(intentAddr, _toAmount);

        // Expect revert due to token mismatch
        vm.expectRevert();
        dp.startAction({
            intent: intent,
            calls: new Call[](0),
            bridgeExtraData: ""
        });
        vm.stopPrank();
    }
}

contract DummyCCTPMessenger is ICCTPTokenMessenger, Test {
    address public immutable expectedBurnToken;
    uint256 public amountBurned;

    constructor(address burnToken) {
        expectedBurnToken = burnToken;
    }

    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64 _nonce) {
        assertEq(amount, 100, "incorrect amount");
        assertEq(destinationDomain, 6, "incorrect destination domain");
        address expectedRecipient = BASE_INTENT_ADDR;
        assertEq(
            mintRecipient,
            bytes32(uint256(uint160(expectedRecipient))),
            "incorrect mint recipient"
        );
        assertEq(burnToken, expectedBurnToken, "incorrect burn token");

        // Burn it
        IERC20(burnToken).transferFrom(msg.sender, address(0xdead), amount);
        amountBurned += amount;

        return 0;
    }
}

contract DummyTokenMinter is ITokenMinter, Test {
    mapping(uint32 => mapping(bytes32 => address)) private localTokens;

    function mint(
        uint32 /*sourceDomain*/,
        bytes32 /*burnToken*/,
        address /*to*/,
        uint256 /*amount*/
    ) external pure returns (address mintToken) {
        mintToken = address(0);
    }

    function burn(address /*burnToken*/, uint256 /*amount*/) external {}

    function getLocalToken(
        uint32 remoteDomain,
        bytes32 remoteToken
    ) public view returns (address) {
        return localTokens[remoteDomain][remoteToken];
    }

    function setTokenController(address /*newTokenController*/) external {}

    // Helper function to set up token mappings for testing
    function setLocalToken(
        uint32 remoteDomain,
        bytes32 remoteToken,
        address localToken
    ) external {
        localTokens[remoteDomain][remoteToken] = localToken;
    }
}

contract DummySpokePool is V3SpokePoolInterface, Test {
    address public immutable expectedInputToken;
    address public immutable expectedOutputToken;
    uint256 public totalInputAmount;
    uint256 public totalOutputAmount;

    constructor(address inputToken, address outputToken) {
        expectedInputToken = inputToken;
        expectedOutputToken = outputToken;
    }

    function depositV3(
        address /* depositor */,
        address recipient,
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 destinationChainId,
        address exclusiveRelayer,
        uint32 quoteTimestamp,
        uint32 fillDeadline,
        uint32 exclusivityDeadline,
        bytes calldata message
    ) external payable {
        assertEq(recipient, LINEA_INTENT_ADDR, "incorrect recipient");
        assertEq(inputToken, expectedInputToken, "incorrect input token");
        assertEq(outputToken, expectedOutputToken, "incorrect output token");
        assertEq(inputAmount, 101, "incorrect input amount");
        assertEq(outputAmount, 100, "incorrect output amount");
        assertEq(destinationChainId, 59144, "incorrect destination chain id");
        assertEq(exclusiveRelayer, address(0), "incorrect exclusive relayer");
        assertEq(quoteTimestamp, block.timestamp, "incorrect quote timestamp");
        assertEq(
            fillDeadline,
            block.timestamp + 1 hours,
            "incorrect fill deadline"
        );
        assertEq(exclusivityDeadline, 0, "incorrect exclusivity deadline");
        assertEq(message, "gm ser", "incorrect message");

        IERC20(inputToken).transferFrom(
            msg.sender,
            address(0xdead),
            inputAmount
        );
        totalInputAmount += inputAmount;
        totalOutputAmount += outputAmount;
    }

    function depositV3Now(
        address depositor,
        address recipient,
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 destinationChainId,
        address exclusiveRelayer,
        uint32 fillDeadlineOffset,
        uint32 exclusivityDeadline,
        bytes calldata message
    ) external payable {}

    function speedUpV3Deposit(
        address depositor,
        uint32 depositId,
        uint256 updatedOutputAmount,
        address updatedRecipient,
        bytes calldata updatedMessage,
        bytes calldata depositorSignature
    ) external {}

    function fillV3Relay(
        V3RelayData calldata relayData,
        uint256 repaymentChainId
    ) external {}

    function fillV3RelayWithUpdatedDeposit(
        V3RelayData calldata relayData,
        uint256 repaymentChainId,
        uint256 updatedOutputAmount,
        address updatedRecipient,
        bytes calldata updatedMessage,
        bytes calldata depositorSignature
    ) external {}

    function requestV3SlowFill(V3RelayData calldata relayData) external {}

    function executeV3SlowRelayLeaf(
        V3SlowFill calldata slowFillLeaf,
        uint32 rootBundleId,
        bytes32[] calldata proof
    ) external {}
}
