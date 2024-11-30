// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {GasInfo} from "@axelar-network/contracts/interfaces/IAxelarGasService.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

import "../../src/pay/DaimoPay.sol";
import "../../src/pay/DaimoPayBridger.sol";
import "../../src/pay/DaimoPayCCTPBridger.sol";
import "../../src/pay/DaimoPayAcrossBridger.sol";
import "../../src/pay/DaimoPayAxelarBridger.sol";
import "../dummy/DaimoDummyUSDC.sol";

address constant BASE_INTENT_ADDR = 0x62bd346d7D099Ff5b363B3032F58F8F7B6e2B5a2;
address constant LINEA_INTENT_ADDR = 0x92E52dA739b7e465036e5919e7f0170b39A8D02F;
address constant BSC_INTENT_ADDR = 0x4343063B8dAD76dA045E0Ec1d963C932B39e2576;

contract DaimoPayTest is Test {
    // Daimo Pay contracts
    DaimoPay public dp;
    PayIntentFactory public intentFactory;

    // Bridging contracts
    DaimoPayBridger public bridger;
    DaimoPayCCTPBridger public cctpBridger;
    DaimoPayAcrossBridger public acrossBridger;
    DaimoPayAxelarBridger public axelarBridger;

    // CCTP dummy contracts
    DummyTokenMinter public tokenMinter;
    DummyCCTPMessenger public messenger;

    // Across dummy contracts
    DummySpokePool public spokePool;

    // Axelar dummy contracts
    DummyAxelarGatewayWithToken public axelarGateway;
    DummyAxelarGasService public axelarGasService;

    // Account addresses
    address immutable _alice = 0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa;
    address immutable _bob = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;
    address immutable _lp = 0x2222222222222222222222222222222222222222;

    uint256 immutable _lpToTokenInitBalance = 1000;

    // Tokens
    IERC20 immutable _fromToken = new TestUSDC{salt: bytes32(uint256(1))}();
    IERC20 immutable _toToken = new TestUSDC{salt: bytes32(uint256(2))}();
    IERC20 immutable _bridgeTokenOption =
        new TestUSDC{salt: bytes32(uint256(3))}();
    // Token that's not registered in the token minter and Across
    IERC20 immutable _unregisteredToken =
        new TestUSDC{salt: bytes32(uint256(420))}();

    // Chains
    uint256 immutable _fromChainId = 10; // Optimism
    uint256 immutable _baseChainId = 8453; // Base
    uint32 immutable _baseDomain = 6; // Base
    uint256 immutable _lineaChainId = 59144; // Linea
    uint256 immutable _bscChainId = 56; // BNB Chain

    // Intent data
    uint256 immutable _toAmount = 100;
    uint256 immutable _bridgeTokenOptionToAmount = 10;

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

        uint256[] memory cctpChainIds = new uint256[](1);
        DaimoPayCCTPBridger.CCTPBridgeRoute[]
            memory cctpBridgeRoutes = new DaimoPayCCTPBridger.CCTPBridgeRoute[](
                1
            );
        cctpChainIds[0] = _baseChainId;
        cctpBridgeRoutes[0] = DaimoPayCCTPBridger.CCTPBridgeRoute({
            domain: _baseDomain,
            bridgeTokenOut: address(_toToken)
        });
        cctpBridger = new DaimoPayCCTPBridger({
            _owner: address(this),
            _tokenMinter: tokenMinter,
            _cctpMessenger: messenger,
            _toChainIds: cctpChainIds,
            _bridgeRoutes: cctpBridgeRoutes
        });

        // Initialize Across bridger
        spokePool = new DummySpokePool(address(_fromToken), address(_toToken));

        uint256[] memory acrossChainIds = new uint256[](1);
        DaimoPayAcrossBridger.AcrossBridgeRoute[]
            memory acrossBridgeRoutes = new DaimoPayAcrossBridger.AcrossBridgeRoute[](
                1
            );
        acrossChainIds[0] = _lineaChainId;
        acrossBridgeRoutes[0] = DaimoPayAcrossBridger.AcrossBridgeRoute({
            bridgeTokenIn: address(_fromToken),
            bridgeTokenOut: address(_toToken),
            pctFee: 1e16, // 1% fee
            flatFee: 10 // (=$0.00001)
        });

        acrossBridger = new DaimoPayAcrossBridger({
            _owner: address(this),
            _spokePool: spokePool,
            _toChainIds: acrossChainIds,
            _bridgeRoutes: acrossBridgeRoutes
        });

        // Initialize Axelar bridger
        axelarGateway = new DummyAxelarGatewayWithToken();
        axelarGasService = new DummyAxelarGasService(
            _toAmount,
            address(_alice)
        );

        uint256[] memory axelarChainIds = new uint256[](1);
        DaimoPayAxelarBridger.AxelarBridgeRoute[]
            memory axelarBridgeRoutes = new DaimoPayAxelarBridger.AxelarBridgeRoute[](
                1
            );
        axelarChainIds[0] = _bscChainId;
        axelarBridgeRoutes[0] = DaimoPayAxelarBridger.AxelarBridgeRoute({
            destChainName: "binance",
            bridgeTokenIn: address(_fromToken),
            bridgeTokenOut: address(_toToken),
            bridgeTokenOutSymbol: "axlUSDC",
            receiverContract: address(0xdead),
            fee: 10 // 10 wei
        });

        axelarBridger = new DaimoPayAxelarBridger({
            _owner: address(this),
            _axelarGateway: axelarGateway,
            _axelarGasService: axelarGasService,
            _toChainIds: axelarChainIds,
            _bridgeRoutes: axelarBridgeRoutes
        });

        // Map _baseChainId to cctpBridger, _lineaChainId to acrossBridger,
        // and _bscChainId to axelarBridger
        uint256[] memory chainIds = new uint256[](3);
        chainIds[0] = _baseChainId;
        chainIds[1] = _lineaChainId;
        chainIds[2] = _bscChainId;
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
        console.log(
            "TestUSDC (bridgeTokenOption) address:",
            address(_bridgeTokenOption)
        );
    }

    function getBridgeTokenOutOptions()
        public
        view
        returns (TokenAmount[] memory)
    {
        TokenAmount[] memory bridgeTokenOutOptions = new TokenAmount[](2);
        bridgeTokenOutOptions[0] = TokenAmount({
            token: _toToken,
            amount: _toAmount
        });
        bridgeTokenOutOptions[1] = TokenAmount({
            token: _bridgeTokenOption,
            amount: _bridgeTokenOptionToAmount
        });
        return bridgeTokenOutOptions;
    }

    function testGetIntentAddr() public view {
        PayIntent memory baseIntent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
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
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
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
            toChainId: _bscChainId,
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
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
        assertEq(actualBnbIntentAddr, BSC_INTENT_ADDR);
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
        TokenAmount[] memory bridgeTokenOutOptions = new TokenAmount[](1);
        bridgeTokenOutOptions[0] = TokenAmount({
            token: IERC20(address(0)),
            amount: _toAmount
        });
        PayIntent memory intent = PayIntent({
            toChainId: _fromChainId,
            bridgeTokenOutOptions: bridgeTokenOutOptions,
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
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
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
        assertEq(
            axelarGateway.totalAmount(),
            0,
            "incorrect Axelar amount received"
        );
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
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
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
        vm.expectEmit(address(_fromToken));
        emit IERC20.Transfer(LINEA_INTENT_ADDR, _alice, 10);

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
        // Check that the CCTP messenger didn't burn tokens
        assertEq(messenger.amountBurned(), 0, "incorrect CCTP amount burned");
        // Check that the Axelar bridger didn't receive tokens
        assertEq(
            axelarGateway.totalAmount(),
            0,
            "incorrect Axelar amount received"
        );

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
            toChainId: _bscChainId,
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // Alice sends some coins to the intent address
        address intentAddr = intentFactory.getIntentAddress(intent);
        _fromToken.transfer(intentAddr, _toAmount);

        // Give the DaimoPayAxelarBridger some native token to pay for gas
        vm.deal(address(axelarBridger), 10);

        vm.expectEmit(address(axelarBridger));
        emit IDaimoPayBridger.BridgeInitiated({
            fromAddress: address(bridger),
            fromToken: address(_fromToken),
            fromAmount: _toAmount,
            toChainId: _bscChainId,
            toAddress: intentAddr,
            toToken: address(_toToken),
            toAmount: _toAmount
        });

        vm.expectEmit(address(dp));
        emit DaimoPay.Start(intentAddr, intent);

        // Encode the refund address in the bridgeExtraData
        bytes memory bridgeExtraData = abi.encode(
            DaimoPayAxelarBridger.ExtraData({
                gasRefundAddress: _alice,
                useExpress: false
            })
        );

        uint256 gasBefore = gasleft();
        dp.startIntent({
            intent: intent,
            calls: new Call[](0),
            bridgeExtraData: bridgeExtraData
        });
        uint256 gasAfter = gasleft();

        console.log("gas used", gasBefore - gasAfter);

        vm.stopPrank();

        assertEq(dp.intentSent(intentAddr), true, "intent not sent");
        // Check that the gas service received the correct amount
        assertEq(
            address(axelarGasService).balance,
            10,
            "incorrect gas service balance"
        );
        // Check that the Axelar bridger received tokens
        assertEq(
            axelarGateway.totalAmount(),
            _toAmount,
            "incorrect Axelar amount received"
        );
        // Check that the CCTP messenger didn't burn tokens
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
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
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

    // Test that the LP gets refunded any surplus tokens after fast finishing
    // the intent.
    function testSimpleFastFinishWithLeftover() public {
        vm.chainId(_baseChainId);

        // Seed the LP with an initial balance
        _toToken.transfer(_lp, _lpToTokenInitBalance);

        // Immediately after Alice's tx confirms, LP sends to Bob
        vm.startPrank(_lp);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
            finalCallToken: TokenAmount({token: _toToken, amount: 1}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        // LP transfers too much of finalCallToken to finish the intent.
        // Only 1 is needed, but 10 is sent.
        _toToken.transfer({to: address(dp), value: 10});

        // An extra 9 of finalCallToken should be sent back to the LP
        vm.expectEmit(address(_toToken));
        emit IERC20.Transfer(address(dp), _lp, 9);

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
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
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

        // LP received funds from intent, and intent is destroyed. Bob has
        // _toAmount tokens from the fast finish.
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
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
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
        // to Bob
        assertEq(_toToken.balanceOf(BASE_INTENT_ADDR), 0);
        assertEq(_toToken.balanceOf(_lp), 0);
        assertEq(_toToken.balanceOf(_bob), _toAmount);
    }

    // Test that the contract reverts when the intent address doesn't have
    // sufficient balance of any bridge token option.
    function testClaimWithInsufficientBalance() public {
        vm.chainId(_baseChainId);

        // Send insufficient funds to the intent address
        _toToken.transfer(BASE_INTENT_ADDR, _toAmount - 1);
        _bridgeTokenOption.transfer(
            BASE_INTENT_ADDR,
            _bridgeTokenOptionToAmount - 1
        );

        // Then, LP claims the funds
        vm.prank(_lp);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
            finalCallToken: TokenAmount({token: _toToken, amount: _toAmount}),
            finalCall: Call({to: _bob, value: 0, data: ""}),
            escrow: payable(address(dp)),
            refundAddress: _alice,
            nonce: _nonce
        });

        vm.expectRevert("PI: insufficient token received");

        dp.claimIntent({intent: intent, calls: new Call[](0)});

        // LP didn't receive funds from intent and the tokens are still in the
        // intent address
        assertEq(_toToken.balanceOf(BASE_INTENT_ADDR), _toAmount - 1);
        assertEq(
            _bridgeTokenOption.balanceOf(BASE_INTENT_ADDR),
            _bridgeTokenOptionToAmount - 1
        );
        assertEq(_toToken.balanceOf(_lp), 0);
        assertEq(_bridgeTokenOption.balanceOf(_lp), 0);
    }

    // Test that the contract reverts when the fromToken doesn't match the
    // localToken returned by the CCTP TokenMinter.
    function testCCTPFromAndToTokenMismatch() public {
        vm.chainId(_baseChainId);

        // Give Alice some coins
        _unregisteredToken.transfer(_alice, 555);

        // Alice initiates a transfer
        vm.startPrank(_alice);

        PayIntent memory intent = PayIntent({
            toChainId: _baseChainId,
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
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
            bridgeTokenOutOptions: getBridgeTokenOutOptions(),
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
        TokenAmount[] memory bridgeTokenOutOptions = new TokenAmount[](2);
        bridgeTokenOutOptions[0] = TokenAmount({
            token: _toToken,
            amount: largeOutputAmount
        });
        bridgeTokenOutOptions[1] = TokenAmount({
            token: _bridgeTokenOption,
            amount: 1
        });
        (
            address actualLargeInputToken,
            uint256 actualLargeInputAmount
        ) = acrossBridger.getBridgeTokenIn({
                toChainId: _lineaChainId,
                bridgeTokenOutOptions: bridgeTokenOutOptions
            });
        assertEq(
            actualLargeInputAmount,
            expectedLargeInputAmount,
            "incorrect large input amount"
        );
        // The Linea bridge route uses (_fromToken, _toToken) as the bridge token
        assertEq(actualLargeInputToken, address(_fromToken), "incorrect token");

        // 10 USDC flat fee is higher than the 1% fee for 1 USDC, so the input
        // amount should use the flat fee.
        uint256 smallOutputAmount = 1;
        uint256 expectedSmallInputAmount = 11;
        bridgeTokenOutOptions[0] = TokenAmount({
            token: _toToken,
            amount: smallOutputAmount
        });
        (
            address actualSmallInputToken,
            uint256 actualSmallInputAmount
        ) = acrossBridger.getBridgeTokenIn({
                toChainId: _lineaChainId,
                bridgeTokenOutOptions: bridgeTokenOutOptions
            });
        assertEq(
            actualSmallInputAmount,
            expectedSmallInputAmount,
            "incorrect small input amount"
        );
        // The Linea bridge route uses (_fromToken, _toToken) as the bridge token
        assertEq(actualSmallInputToken, address(_fromToken), "incorrect token");
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

contract DummyAxelarGatewayWithToken is IAxelarGatewayWithToken, Test {
    uint256 public totalAmount;

    constructor() {
        totalAmount = 0;
    }

    function callContractWithToken(
        string calldata destinationChain,
        string calldata contractAddress,
        bytes calldata payload,
        string calldata symbol,
        uint256 amount
    ) external {
        assertEq(destinationChain, "binance", "incorrect destination chain");
        assertEq(
            contractAddress,
            Strings.toHexString(address(0xdead)),
            "incorrect contract address"
        );
        assertEq(payload, abi.encode(BSC_INTENT_ADDR), "incorrect payload");
        assertEq(symbol, "axlUSDC", "incorrect symbol");

        totalAmount += amount;
    }

    function callContract(
        string calldata /* destinationChain */,
        string calldata /* destinationContractAddress */,
        bytes calldata /* payload */
    ) external pure {
        revert("not implemented");
    }

    function isContractCallApproved(
        bytes32 /* commandId */,
        string calldata /* sourceChain */,
        string calldata /* sourceAddress */,
        address /* contractAddress */,
        bytes32 /* payloadHash */
    ) external pure returns (bool) {
        revert("not implemented");
    }

    function validateContractCall(
        bytes32 /* commandId */,
        string calldata /* sourceChain */,
        string calldata /* sourceAddress */,
        bytes32 /* payloadHash */
    ) external pure returns (bool) {
        revert("not implemented");
    }

    function isCommandExecuted(
        bytes32 /* commandId */
    ) external pure returns (bool) {
        revert("not implemented");
    }

    function sendToken(
        string calldata /* destinationChain */,
        string calldata /* destinationAddress */,
        string calldata /* symbol */,
        uint256 /* amount */
    ) external pure {
        revert("not implemented");
    }

    function isContractCallAndMintApproved(
        bytes32 /* commandId */,
        string calldata /* sourceChain */,
        string calldata /* sourceAddress */,
        address /* contractAddress */,
        bytes32 /* payloadHash */,
        string calldata /* symbol */,
        uint256 /* amount */
    ) external pure returns (bool) {
        revert("not implemented");
    }

    function validateContractCallAndMint(
        bytes32 /* commandId */,
        string calldata /* sourceChain */,
        string calldata /* sourceAddress */,
        bytes32 /* payloadHash */,
        string calldata /* symbol */,
        uint256 /* amount */
    ) external pure returns (bool) {
        revert("not implemented");
    }

    function tokenAddresses(
        string memory /* symbol */
    ) external pure returns (address) {
        revert("not implemented");
    }
}

contract DummyAxelarGasService is IAxelarGasService, Test {
    uint256 public immutable expectedAmount;
    address public immutable expectedRefundAddress;

    constructor(uint256 amount, address refundAddress) {
        expectedAmount = amount;
        expectedRefundAddress = refundAddress;
    }

    function payNativeGasForContractCallWithToken(
        address /* sender */,
        string calldata destinationChain,
        string calldata destinationAddress,
        bytes calldata payload,
        string calldata symbol,
        uint256 amount,
        address refundAddress
    ) external payable {
        assertEq(destinationChain, "binance", "incorrect destination chain");
        assertEq(
            destinationAddress,
            Strings.toHexString(address(0xdead)),
            "incorrect destination address"
        );
        assertEq(payload, abi.encode(BSC_INTENT_ADDR), "incorrect payload");
        assertEq(symbol, "axlUSDC", "incorrect symbol");
        assertEq(amount, expectedAmount, "incorrect amount");
        assertEq(
            refundAddress,
            expectedRefundAddress,
            "incorrect refund address"
        );
    }

    function payNativeGasForExpressCallWithToken(
        address /* sender */,
        string calldata /* destinationChain */,
        string calldata /* destinationAddress */,
        bytes calldata /* payload */,
        string calldata /* symbol */,
        uint256 /* amount */,
        address /* refundAddress */
    ) external payable {
        revert("not implemented");
    }

    function getGasInfo(
        string calldata /* chain */
    ) external pure returns (GasInfo memory) {
        revert("not implemented");
    }

    function estimateGasFee(
        string calldata /* destinationChain */,
        string calldata /* destinationAddress */,
        bytes calldata /* payload */,
        uint256 /* executionGasLimit */,
        bytes calldata /* params */
    ) external pure returns (uint256 /* gasEstimate */) {
        revert("not implemented");
    }

    function payGas(
        address /* sender */,
        string calldata /* destinationChain */,
        string calldata /* destinationAddress */,
        bytes calldata /* payload */,
        uint256 /* executionGasLimit */,
        bool /* estimateOnChain */,
        address /* refundAddress */,
        bytes calldata /* params */
    ) external payable {
        revert("not implemented");
    }

    function payGasForContractCall(
        address /* sender */,
        string calldata /* destinationChain */,
        string calldata /* destinationAddress */,
        bytes calldata /* payload */,
        address /* gasToken */,
        uint256 /* gasFeeAmount */,
        address /* refundAddress */
    ) external pure {
        revert("not implemented");
    }

    function payGasForContractCallWithToken(
        address /* sender */,
        string calldata /* destinationChain */,
        string calldata /* destinationAddress */,
        bytes calldata /* payload */,
        string calldata /* symbol */,
        uint256 /* amount */,
        address /* gasToken */,
        uint256 /* gasFeeAmount */,
        address /* refundAddress */
    ) external pure {
        revert("not implemented");
    }

    function payNativeGasForContractCall(
        address /* sender */,
        string calldata /* destinationChain */,
        string calldata /* destinationAddress */,
        bytes calldata /* payload */,
        address /* refundAddress */
    ) external payable {
        revert("not implemented");
    }

    function payGasForExpressCall(
        address /* sender */,
        string calldata /* destinationChain */,
        string calldata /* destinationAddress */,
        bytes calldata /* payload */,
        address /* gasToken */,
        uint256 /* gasFeeAmount */,
        address /* refundAddress */
    ) external pure {
        revert("not implemented");
    }

    function payGasForExpressCallWithToken(
        address /* sender */,
        string calldata /* destinationChain */,
        string calldata /* destinationAddress */,
        bytes calldata /* payload */,
        string calldata /* symbol */,
        uint256 /* amount */,
        address /* gasToken */,
        uint256 /* gasFeeAmount */,
        address /* refundAddress */
    ) external pure {
        revert("not implemented");
    }

    function payNativeGasForExpressCall(
        address /* sender */,
        string calldata /* destinationChain */,
        string calldata /* destinationAddress */,
        bytes calldata /* payload */,
        address /* refundAddress */
    ) external payable {
        revert("not implemented");
    }

    function addGas(
        bytes32 /* txHash */,
        uint256 /* logIndex */,
        address /* gasToken */,
        uint256 /* gasFeeAmount */,
        address /* refundAddress */
    ) external pure {
        revert("not implemented");
    }

    function addNativeGas(
        bytes32 /* txHash */,
        uint256 /* logIndex */,
        address /* refundAddress */
    ) external payable {
        revert("not implemented");
    }

    function addExpressGas(
        bytes32 /* txHash */,
        uint256 /* logIndex */,
        address /* gasToken */,
        uint256 /* gasFeeAmount */,
        address /* refundAddress */
    ) external pure {
        revert("not implemented");
    }

    function addNativeExpressGas(
        bytes32 /* txHash */,
        uint256 /* logIndex */,
        address /* refundAddress */
    ) external payable {
        revert("not implemented");
    }

    function updateGasInfo(
        string[] calldata /* chains */,
        GasInfo[] calldata /* gasUpdates */
    ) external pure {
        revert("not implemented");
    }

    function collectFees(
        address payable /* receiver */,
        address[] calldata /* tokens */,
        uint256[] calldata /* amounts */
    ) external pure {
        revert("not implemented");
    }

    function refund(
        bytes32 /* txHash */,
        uint256 /* logIndex */,
        address payable /* receiver */,
        address /* token */,
        uint256 /* amount */
    ) external pure {
        revert("not implemented");
    }

    function gasCollector() external pure returns (address) {
        revert("not implemented");
    }

    function acceptOwnership() external pure {
        revert("not implemented");
    }

    function contractId() external pure returns (bytes32) {
        revert("not implemented");
    }

    function implementation() external pure returns (address) {
        revert("not implemented");
    }

    function owner() external pure returns (address) {
        revert("not implemented");
    }

    function pendingOwner() external pure returns (address) {
        revert("not implemented");
    }

    function proposeOwnership(address /* newOwner */) external pure {
        revert("not implemented");
    }

    function setup(bytes calldata /* data */) external pure {
        revert("not implemented");
    }

    function transferOwnership(address /* newOwner */) external pure {
        revert("not implemented");
    }

    function upgrade(
        address /* newImplementation */,
        bytes32 /* newImplementationCodeHash */,
        bytes calldata /* params */
    ) external pure {
        revert("not implemented");
    }
}
