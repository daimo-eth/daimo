// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";
import "account-abstraction/core/EntryPoint.sol";

import "../src/pay/DaimoPay.sol";
import "../src/pay/DaimoPayBridger.sol";
import "../src/pay/DaimoPayCCTPBridger.sol";
import "../src/pay/DaimoPayAcrossBridger.sol";
import "../src/pay/DaimoPayAxelarBridger.sol";
import "../src/pay/DaimoPayAxelarReceiver.sol";
import "./dummy/DaimoDummyUSDC.sol";

address constant BASE_INTENT_ADDR = 0xd880D93c97dBc39424c8199F85C63EFCBcc2727D;
address constant LINEA_INTENT_ADDR = 0xD7d57FF9931D6AB74A4b05a1ed2A2368D485860b;
address constant BNB_INTENT_ADDR = 0xAB83a49FE9F96C45E6F5EB1fAa2755987522ac38;

contract DaimoPayTest is Test {
    // Daimo Pay contracts
    DaimoPay public dp;
    PayIntentFactory public intentFactory;

    // Bridging contracts
    DaimoPayBridger public bridger;
    DaimoPayCCTPBridger public cctpBridger;
    DaimoPayAcrossBridger public acrossBridger;
    DaimoPayAxelarBridger public axelarBridger;
    DaimoPayAxelarReceiver public axelarReceiver;

    // CCTP dummy contracts
    DummyTokenMinter public tokenMinter;
    DummyCCTPMessenger public messenger;

    // Across dummy contracts
    DummySpokePool public spokePool;

    // Axelar dummy contracts
    // DummyAxelarGateway public axelarGateway;

    // Account addresses
    address immutable _alice = 0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa;
    address immutable _bob = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;
    address immutable _lp = 0x2222222222222222222222222222222222222222;

    uint256 immutable _lpToTokenInitBalance = 1000;

    // Tokens
    IERC20 immutable _fromToken = new TestUSDC{salt: bytes32(uint256(1))}();
    IERC20 immutable _toToken = new TestUSDC{salt: bytes32(uint256(2))}();
    // Token that's not registered in the token minter and Across
    IERC20 immutable _unregisteredToken =
        new TestUSDC{salt: bytes32(uint256(420))}();

    // Chains
    uint256 immutable _fromChainId = 10; // Optimism
    uint256 immutable _baseChainId = 8453; // Base
    uint32 immutable _baseDomain = 6; // Base
    uint256 immutable _lineaChainId = 59144; // Linea
    uint256 immutable _bnbChainId = 56; // BNB Chain

    // Intent data
    uint256 immutable _toAmount = 100;

    uint256 immutable _nonce = 1;

    function setUp() public {
        intentFactory = new PayIntentFactory();

        // Initialize CCTP bridger
        tokenMinter = new DummyTokenMinter();
        tokenMinter.setLocalToken(
            _baseDomain,
            bytes32(uint256(uint160(address(_toToken)))),
            address(_fromToken)
        );
        messenger = new DummyCCTPMessenger(address(_fromToken));

        cctpBridger = new DaimoPayCCTPBridger({
            _owner: address(this),
            _tokenMinter: tokenMinter,
            _cctpMessenger: messenger,
            _cctpChainIds: new uint256[](0),
            _cctpDomains: new uint32[](0)
        });
        cctpBridger.addCCTPDomain({chainId: _baseChainId, domain: _baseDomain});

        // Initialize Across bridger
        spokePool = new DummySpokePool(address(_fromToken), address(_toToken));

        acrossBridger = new DaimoPayAcrossBridger({
            _owner: address(this),
            _spokePool: spokePool,
            _toChainIds: new uint256[](0),
            _toTokens: new address[](0),
            _bridgeRoutes: new DaimoPayAcrossBridger.AcrossBridgeRoute[](0)
        });
        acrossBridger.addBridgeRoute({
            toChainId: _lineaChainId,
            toToken: address(_toToken),
            bridgeRoute: DaimoPayAcrossBridger.AcrossBridgeRoute({
                localToken: address(_fromToken),
                pctFee: 1e16, // 1% fee
                flatFee: 10 // (=$0.00001)
            })
        });

        // Initialize Axelar bridger
        // axelarGateway = new DummyAxelarGateway();
        // axelarReceiver = new DaimoPayAxelarReceiver(address(axelarGateway));
        // axelarBridger = new DaimoPayAxelarBridger({
        //     _owner: address(this),
        //     _axelarGateway: axelarGateway,
        //     _toChainIds: new uint256[](0),
        //     _toTokens: new address[](0),
        //     _bridgeRoutes: new DaimoPayAxelarBridger.AxelarBridgeRoute[](0)
        // });
        // axelarBridger.addBridgeRoute({
        //     toChainId: _bnbChainId,
        //     toToken: address(_toToken),
        //     bridgeRoute: DaimoPayAxelarBridger.AxelarBridgeRoute({
        //         destChainName: "binance",
        //         tokenSymbol: "axlUSDC",
        //         localTokenAddr: address(_fromToken),
        //         fee: 10 // (= $0.00001)
        //     })
        // });

        // Map _baseChainId to cctpBridger, _lineaChainId to acrossBridger,
        // and _bnbChainId to axelarBridger
        uint256[] memory chainIds = new uint256[](3);
        chainIds[0] = _baseChainId;
        chainIds[1] = _lineaChainId;
        chainIds[2] = _bnbChainId;
        IDaimoPayBridger[] memory bridgers = new IDaimoPayBridger[](3);
        bridgers[0] = cctpBridger;
        bridgers[1] = acrossBridger;
        bridgers[2] = axelarBridger;

        bridger = new DaimoPayBridger({
            _owner: address(this),
            _chainIds: chainIds,
            _bridgers: bridgers
        });

        dp = new DaimoPay(intentFactory, bridger);

        // Log addresses of initialized contracts
        console.log("PayIntentFactory address:", address(intentFactory));
        console.log("DummyTokenMinter address:", address(tokenMinter));
        console.log("DummyCCTPMessenger address:", address(messenger));
        console.log("DaimoPayCCTPBridger address:", address(cctpBridger));
        console.log("DaimoPayAcrossBridger address:", address(acrossBridger));
        console.log("DaimoPayAxelarBridger address:", address(axelarBridger));
        console.log("DaimoPayBridger address:", address(bridger));
        console.log("DaimoPay address:", address(dp));
        console.log("TestUSDC (fromToken) address:", address(_fromToken));
        console.log("TestUSDC (toToken) address:", address(_toToken));
    }

    function testGetIntentAddr() public view {
        // Get the intent address for the Base chain
        PayIntent memory baseIntent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        address actualBaseIntentAddr = intentFactory.getIntentAddress(
            baseIntent
        );
        console.log("actual base intent addr:", actualBaseIntentAddr);

        // Get the intent address for the Linea chain
        PayIntent memory lineaIntent = PayIntent({
            toChainId: _lineaChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });
        address actualLineaIntentAddr = intentFactory.getIntentAddress(
            lineaIntent
        );
        console.log("actual linea intent addr:", actualLineaIntentAddr);

        // Get the intent address for the BNB chain
        PayIntent memory bnbIntent = PayIntent({
            toChainId: _bnbChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });
        address actualBnbIntentAddr = intentFactory.getIntentAddress(bnbIntent);
        console.log("actual bnb intent addr:", actualBnbIntentAddr);

        assertEq(actualBaseIntentAddr, BASE_INTENT_ADDR);
        assertEq(actualLineaIntentAddr, LINEA_INTENT_ADDR);
        assertEq(actualBnbIntentAddr, BNB_INTENT_ADDR);
    }

    // Test that startIntent reverts when the intent is on the same chain.
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
                token: IERC20(address(0)),
                amount: _toAmount
            }),
            finalCallToken: TokenAmount({
                token: IERC20(address(0)),
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
        dp.startIntent({
            intent: intent,
            calls: new Call[](0),
            bridgeExtraData: ""
        });

        vm.stopPrank();
    }

    // Test a simple startIntent call that bridges using CCTP.
    // Simple = no pre-swap, no post-call.
    function testSimpleCCTPStart() public {
        vm.chainId(_fromChainId);

        // Give Alice some coins
        _fromToken.transfer(_alice, 555);

        // Alice initiates a transfer
        vm.startPrank(_alice);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // Alice sends some coins to the intent address
        address intentAddr = intentFactory.getIntentAddress(intent);
        _fromToken.transfer(intentAddr, _toAmount);

        vm.expectEmit(address(cctpBridger));
        emit IDaimoPayBridger.BridgeInitiated({
            fromAddress: address(bridger),
            fromToken: address(_fromToken),
            fromAmount: _toAmount,
            toChainId: _baseChainId,
            toAddress: BASE_INTENT_ADDR,
            toToken: address(_toToken),
            toAmount: _toAmount
        });
        vm.expectEmit(address(dp));
        emit DaimoPay.Start(BASE_INTENT_ADDR, intent);

        uint256 gasBefore = gasleft();
        dp.startIntent({
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
        // Check that the Axelar bridger didn't receive tokens
        // assertEq(
        //     axelarGateway.totalInputAmount(),
        //     0,
        //     "incorrect Axelar amount received"
        // );
    }

    // Test a simple startIntent call that bridges using Across.
    // Simple = no pre-swap, no post-call.
    function testSimpleAcrossStart() public {
        vm.chainId(_fromChainId);

        // Give Alice some coins
        _fromToken.transfer(_alice, 555);

        // Alice initiates a transfer
        vm.startPrank(_alice);

        PayIntent memory intent = PayIntent({
            toChainId: _lineaChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
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
        // expects the maximum of either a 1% fee or 10 USDC (=$0.00001) flat
        // fee. Send more than enough for the fee.
        uint256 inputAmount = 120;
        address intentAddr = intentFactory.getIntentAddress(intent);
        _fromToken.transfer(intentAddr, inputAmount);

        // The Across bridger should only take what is needed to cover the fee.
        uint256 expectedInputAmount = 110; // _toAmount with 10 USDC flat fee

        vm.expectEmit(address(acrossBridger));
        emit IDaimoPayBridger.BridgeInitiated({
            fromAddress: address(bridger),
            fromToken: address(_fromToken),
            fromAmount: expectedInputAmount,
            toChainId: _lineaChainId,
            toAddress: LINEA_INTENT_ADDR,
            toToken: address(_toToken),
            toAmount: _toAmount
        });

        // Extra tokens should be refunded to the caller
        vm.expectEmit(LINEA_INTENT_ADDR);
        emit TokenRefund.RefundedTokens({
            recipient: _alice,
            token: address(_fromToken),
            amount: 10
        });

        vm.expectEmit(address(dp));
        emit DaimoPay.Start(LINEA_INTENT_ADDR, intent);

        uint256 gasBefore = gasleft();
        dp.startIntent({
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
        // Check that the Axelar bridger didn't receive tokens
        // assertEq(
        //     axelarGateway.totalInputAmount(),
        //     0,
        //     "incorrect Axelar amount received"
        // );

        // Check that the extra tokens were refunded to the caller
        assertEq(_fromToken.balanceOf(_alice), 555 - 120 + 10);
    }

    // Test a simple startIntent call that bridges using Axelar.
    // Simple = no pre-swap, no post-call.
    function testSimpleAxelarStart() public {
        vm.chainId(_fromChainId);

        // Give Alice some coins
        _fromToken.transfer(_alice, 555);

        // Alice initiates a transfer
        vm.startPrank(_alice);

        PayIntent memory intent = PayIntent({
            toChainId: _bnbChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // Alice sends some coins to the intent address, enough to cover the
        // 10 USDC flat fee.
        uint256 inputAmount = _toAmount + 10;
        address intentAddr = intentFactory.getIntentAddress(intent);
        _fromToken.transfer(intentAddr, inputAmount);

        vm.expectEmit(address(axelarBridger));
        emit IDaimoPayBridger.BridgeInitiated({
            fromAddress: address(bridger),
            fromToken: address(_fromToken),
            fromAmount: inputAmount,
            toChainId: _bnbChainId,
            toAddress: intentAddr,
            toToken: address(_toToken),
            toAmount: _toAmount
        });

        vm.expectEmit(address(dp));
        emit DaimoPay.Start(intentAddr, intent);

        uint256 gasBefore = gasleft();
        dp.startIntent({
            intent: intent,
            calls: new Call[](0),
            bridgeExtraData: ""
        });
        uint256 gasAfter = gasleft();

        console.log("gas used", gasBefore - gasAfter);

        vm.stopPrank();

        assertEq(dp.intentSent(intentAddr), true, "intent not sent");
        // Check that the Axelar bridger received tokens
        // assertEq(
        //     axelarGateway.totalInputAmount(),
        //     inputAmount,
        //     "incorrect Axelar amount received"
        // );
        // Check that the CCTP messenger didn't burned tokens
        assertEq(messenger.amountBurned(), 0, "incorrect CCTP amount burned");
        // Check that the Across bridger didn't receive tokens
        assertEq(
            spokePool.totalInputAmount(),
            0,
            "incorrect Across amount received"
        );
    }

    // Test that a simple fastFinishIntent completes successfully.
    // Simple = no swap, no finalCall, just a transfer to the recipient.
    function testSimpleFastFinish() public {
        vm.chainId(_baseChainId);

        // Seed the LP with an initial balance
        _toToken.transfer(_lp, _lpToTokenInitBalance);

        // Immediately after Alice's tx confirms, LP sends to Bob
        vm.startPrank(_lp);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // LP transfers the token to the intent address
        _toToken.transfer({to: address(dp), value: _toAmount});

        vm.expectEmit(address(dp));
        emit DaimoPay.IntentFinished({
            intentAddr: BASE_INTENT_ADDR,
            destinationAddr: _bob,
            success: true,
            intent: intent
        });
        vm.expectEmit(address(dp));
        emit DaimoPay.FastFinish({
            intentAddr: BASE_INTENT_ADDR,
            newRecipient: _lp
        });

        dp.fastFinishIntent({intent: intent, calls: new Call[](0)});

        vm.stopPrank();

        // LP sent funds to the recipient
        assertEq(_toToken.balanceOf(_lp), _lpToTokenInitBalance - _toAmount);
        assertEq(_toToken.balanceOf(_bob), _toAmount);
    }

    function testSimpleFastFinishWithLeftover() public {
        vm.chainId(_baseChainId);

        // Seed the LP with an initial balance
        _toToken.transfer(_lp, _lpToTokenInitBalance);

        // Immediately after Alice's tx confirms, LP sends to Bob
        vm.startPrank(_lp);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: 1}),
            finalCallToken: TokenAmount({token: _toToken, amount: 1}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // LP transfers too much of finalCallToken to the intent address
        _toToken.transfer({to: address(dp), value: 10});

        // An extra 9 of finalCallToken should be sent back to the LP
        vm.expectEmit(address(dp));
        emit TokenRefund.RefundedTokens({
            recipient: _lp,
            token: address(_toToken),
            amount: 9
        });

        dp.fastFinishIntent({intent: intent, calls: new Call[](0)});

        vm.stopPrank();

        // LP sent only 1 of finalCallToken to the recipient and 9 were sent back
        assertEq(_toToken.balanceOf(_lp), _lpToTokenInitBalance - 1);
        assertEq(_toToken.balanceOf(_bob), 1);
    }

    // Test that the LP can claim the funds after the bridged funds arrive.
    function testSimpleLPClaim() public {
        testSimpleFastFinish();

        // Wait for CCTP to relay the message
        vm.warp(block.timestamp + 20 minutes);

        // CCTP receiveMessage() sends funds to the intent address
        _toToken.transfer(BASE_INTENT_ADDR, _toAmount);

        // Then, LP claims the funds
        vm.prank(_lp);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        vm.expectEmit(address(dp));
        emit DaimoPay.Claim({
            intentAddr: BASE_INTENT_ADDR,
            finalRecipient: _lp
        });

        dp.claimIntent({intent: intent, calls: new Call[](0)});

        // LP received funds from intent, and intent is destroyed
        assertEq(_toToken.balanceOf(BASE_INTENT_ADDR), 0);
        assertEq(_toToken.balanceOf(_lp), _lpToTokenInitBalance);
        assertEq(_toToken.balanceOf(_bob), _toAmount);
    }

    // Test that the funds are sent to the final recipient if no LP claims.
    function testClaimWithoutFastFinish() public {
        vm.chainId(_baseChainId);

        // Wait for CCTP to relay the message
        vm.warp(block.timestamp + 20 minutes);

        // CCTP receiveMessage() sends funds to the intent address
        _toToken.transfer(BASE_INTENT_ADDR, _toAmount);

        // Then, a third party calls claimIntent
        vm.prank(_lp);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        vm.expectEmit(address(dp));
        emit DaimoPay.IntentFinished({
            intentAddr: BASE_INTENT_ADDR,
            destinationAddr: _bob,
            success: true,
            intent: intent
        });
        vm.expectEmit(address(dp));
        emit DaimoPay.Claim({
            intentAddr: BASE_INTENT_ADDR,
            finalRecipient: _bob
        });

        dp.claimIntent({intent: intent, calls: new Call[](0)});

        // LP doesn't receive funds, intent is destroyed, and funds are sent
        // to the final recipient
        assertEq(_toToken.balanceOf(BASE_INTENT_ADDR), 0);
        assertEq(_toToken.balanceOf(_lp), 0);
        assertEq(_toToken.balanceOf(_bob), _toAmount);
    }

    // Test that the contract reverts when the fromToken doesn't match the
    // localToken returned by the CCTP TokenMinter.
    function testCCTPFromAndToTokenMismatch() public {
        vm.chainId(_fromChainId);

        // Give Alice some coins
        _unregisteredToken.transfer(_alice, 555);

        // Alice initiates a transfer
        vm.startPrank(_alice);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // Alice sends some coins to the intent address
        address intentAddr = intentFactory.getIntentAddress(intent);
        _unregisteredToken.transfer(intentAddr, _toAmount);

        // Expect revert due to token mismatch
        vm.expectRevert();
        dp.startIntent({
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

        // Give Alice some coins
        _unregisteredToken.transfer(_alice, 555);

        // Alice initiates a transfer
        vm.startPrank(_alice);

        PayIntent memory intent = PayIntent({
            toChainId: _lineaChainId,
            bridgeTokenOut: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // Alice sends some coins to the intent address
        address intentAddr = intentFactory.getIntentAddress(intent);
        _unregisteredToken.transfer(intentAddr, _toAmount);

        // Expect revert due to token mismatch
        vm.expectRevert();
        dp.startIntent({
            intent: intent,
            calls: new Call[](0),
            bridgeExtraData: ""
        });
        vm.stopPrank();
    }

    // Test that the Across bridger correctly calculates the input amount with
    // a fees included.
    function testAcrossFeeCalculation() public view {
        // 1% fee is higher than the 10 USDC flat fee for 1,000,000 USDC, so
        // the input amount should use the 1% fee.
        uint256 largeOutputAmount = 1000000;
        uint256 expectedLargeInputAmount = 1010000;
        (, uint256 actualLargeInputAmount) = acrossBridger.getInputTokenAmount({
            toChainId: _lineaChainId,
            toToken: address(_toToken),
            toAmount: largeOutputAmount
        });
        assertEq(
            actualLargeInputAmount,
            expectedLargeInputAmount,
            "incorrect large input amount"
        );

        // 10 USDC flat fee is higher than the 1% fee for 1 USDC, so the input
        // amount should use the flat fee.
        uint256 smallOutputAmount = 1;
        uint256 expectedSmallInputAmount = 11;
        (, uint256 actualSmallInputAmount) = acrossBridger.getInputTokenAmount({
            toChainId: _lineaChainId,
            toToken: address(_toToken),
            toAmount: smallOutputAmount
        });
        assertEq(
            actualSmallInputAmount,
            expectedSmallInputAmount,
            "incorrect small input amount"
        );
    }
}

contract DummyCCTPMessenger is ICCTPTokenMessenger, Test {
    address public immutable expectedBurnToken;
    uint256 public amountBurned;

    constructor(address burnToken) {
        expectedBurnToken = burnToken;
        amountBurned = 0;
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
        totalInputAmount = 0;
        totalOutputAmount = 0;
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
        assertEq(inputAmount, 110, "incorrect input amount");
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

// contract DummyAxelarGateway is IAxelarGateway, Test {
//     uint256 public totalInputAmount;

//     /********************\
//     |* Public Functions *|
//     \********************/

//     function sendToken(
//         string calldata destinationChain,
//         string calldata destinationAddress,
//         string calldata symbol,
//         uint256 amount
//     ) external {
//         assertEq(destinationChain, "binance", "incorrect destination chain");
//         assertEq(
//             destinationAddress,
//             Strings.toHexString(BNB_INTENT_ADDR),
//             "incorrect destination address"
//         );
//         assertEq(symbol, "axlUSDC", "incorrect symbol");
//         totalInputAmount += amount;
//     }

//     function callContract(
//         string calldata /* destinationChain */,
//         string calldata /* contractAddress */,
//         bytes calldata /* payload */
//     ) external pure {
//         revert("not implemented");
//     }

//     function callContractWithToken(
//         string calldata /* destinationChain */,
//         string calldata /* contractAddress */,
//         bytes calldata /* payload */,
//         string calldata /* symbol */,
//         uint256 /* amount */
//     ) external pure {
//         revert("not implemented");
//     }

//     function isContractCallApproved(
//         bytes32 /* commandId */,
//         string calldata /* sourceChain */,
//         string calldata /* sourceAddress */,
//         address /* contractAddress */,
//         bytes32 /* payloadHash */
//     ) external pure returns (bool) {
//         revert("not implemented");
//     }

//     function isContractCallAndMintApproved(
//         bytes32 /* commandId */,
//         string calldata /* sourceChain */,
//         string calldata /* sourceAddress */,
//         address /* contractAddress */,
//         bytes32 /* payloadHash */,
//         string calldata /* symbol */,
//         uint256 /* amount */
//     ) external pure returns (bool) {
//         revert("not implemented");
//     }

//     function validateContractCall(
//         bytes32 /* commandId */,
//         string calldata /* sourceChain */,
//         string calldata /* sourceAddress */,
//         bytes32 /* payloadHash */
//     ) external pure returns (bool) {
//         revert("not implemented");
//     }

//     function validateContractCallAndMint(
//         bytes32 /* commandId */,
//         string calldata /* sourceChain */,
//         string calldata /* sourceAddress */,
//         bytes32 /* payloadHash */,
//         string calldata /* symbol */,
//         uint256 /* amount */
//     ) external pure returns (bool) {
//         revert("not implemented");
//     }

//     /***********\
//     |* Getters *|
//     \***********/

//     function authModule() external pure returns (address) {
//         revert("not implemented");
//     }

//     function tokenDeployer() external pure returns (address) {
//         revert("not implemented");
//     }

//     function tokenMintLimit(
//         string memory /* symbol */
//     ) external pure returns (uint256) {
//         revert("not implemented");
//     }

//     function tokenMintAmount(
//         string memory /* symbol */
//     ) external pure returns (uint256) {
//         revert("not implemented");
//     }

//     function allTokensFrozen() external pure returns (bool) {
//         revert("not implemented");
//     }

//     function implementation() external pure returns (address) {
//         revert("not implemented");
//     }

//     function tokenAddresses(
//         string memory /* symbol */
//     ) external pure returns (address) {
//         revert("not implemented");
//     }

//     function tokenFrozen(
//         string memory /* symbol */
//     ) external pure returns (bool) {
//         revert("not implemented");
//     }

//     function isCommandExecuted(
//         bytes32 /* commandId */
//     ) external pure returns (bool) {
//         revert("not implemented");
//     }

//     function adminEpoch() external pure returns (uint256) {
//         revert("not implemented");
//     }

//     function adminThreshold(
//         uint256 /* epoch */
//     ) external pure returns (uint256) {
//         revert("not implemented");
//     }

//     function admins(
//         uint256 /* epoch */
//     ) external pure returns (address[] memory) {
//         revert("not implemented");
//     }

//     /*******************\
//     |* Admin Functions *|
//     \*******************/

//     function setTokenMintLimits(
//         string[] calldata /* symbols */,
//         uint256[] calldata /* limits */
//     ) external pure {
//         revert("not implemented");
//     }

//     function upgrade(
//         address /* newImplementation */,
//         bytes32 /* newImplementationCodeHash */,
//         bytes calldata /* setupParams */
//     ) external pure {
//         revert("not implemented");
//     }

//     /**********************\
//     |* External Functions *|
//     \**********************/

//     function setup(bytes calldata /* params */) external pure {
//         revert("not implemented");
//     }

//     function execute(bytes calldata /* input */) external pure {
//         revert("not implemented");
//     }
// }
