// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "../src/DaimoRequest.sol";

contract TestDAI is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    // Exclude from forge coverage
    function test() public {}
}

contract RequestTest is Test {
    TestDAI public token;
    DaimoRequest public daimoRequest;
    address public constant ALICE = address(0x123);
    address public constant BOB = address(0x456);

    function setUp() public {
        token = new TestDAI("TestDAI", "DAI");
        daimoRequest = new DaimoRequest(token);
    }

    function _createRequestAlice(uint256 id, uint256 amount) internal {
        bytes memory metadata = abi.encodePacked("random");
        vm.expectEmit(false, false, false, false);
        emit DaimoRequest.RequestCreated(
            id,
            ALICE,
            msg.sender,
            amount,
            metadata
        );
        daimoRequest.createRequest(id, ALICE, amount, metadata);
    }

    function _fulfillRequestBob(uint256 id, uint256 amount) internal {
        vm.startPrank(BOB, BOB);
        token.approve(address(daimoRequest), amount);
        vm.expectEmit(false, false, false, false);
        emit DaimoRequest.RequestFulfilled(id, BOB);
        daimoRequest.fulfillRequest(id);
        vm.stopPrank();
    }

    function testRegularFlow() public {
        token.mint(BOB, 1000);

        // Creates a new request of 500 DAI to ALICE
        _createRequestAlice(1, 500);

        // Bob fulfills the request, emits event
        _fulfillRequestBob(1, 500);

        // Bob tries to fulfill the request again, fails
        vm.startPrank(BOB, BOB);
        vm.expectRevert();
        _fulfillRequestBob(1, 500);
        vm.stopPrank();

        // Check transfer went through correctly
        assertEq(token.balanceOf(ALICE), 500);
        assertEq(token.balanceOf(BOB), 0);
        assertEq(token.balanceOf(address(daimoRequest)), 0);
    }

    function testCancelFlow() public {
        token.mint(BOB, 1000);

        // Alice creates a new request of 420 DAI to herself
        _createRequestAlice(2, 420);

        // Bob tries to cancel the request, fails
        vm.startPrank(BOB, BOB);
        vm.expectRevert("Not request recipient");
        daimoRequest.updateRequest(2, RequestStatus.Cancelled);
        vm.stopPrank();

        // Alice cancels the request, emits event
        vm.expectEmit(false, false, false, false);
        vm.startPrank(ALICE, ALICE);
        emit DaimoRequest.RequestCancelled(2, ALICE);
        daimoRequest.updateRequest(2, RequestStatus.Cancelled);
        vm.stopPrank();

        // Bob tries to pay cancelled request, fails
        vm.startPrank(BOB, BOB);
        token.approve(address(daimoRequest), 420);
        vm.expectRevert("Request already fulfilled or cancelled");
        daimoRequest.fulfillRequest(2);
        vm.stopPrank();

        // Check no transfer went through
        assertEq(token.balanceOf(ALICE), 0);
        assertEq(token.balanceOf(BOB), 1000);
        assertEq(token.balanceOf(address(daimoRequest)), 0);
    }

    function testMarkedPaidFlow() public {
        token.mint(BOB, 1000);

        // Alice creates a new request of 420 DAI to herself
        _createRequestAlice(2, 420);

        // Alice marks the request paid, emits event
        vm.expectEmit(false, false, false, false);
        vm.startPrank(ALICE, ALICE);
        emit DaimoRequest.RequestFulfilled(2, ALICE);
        daimoRequest.updateRequest(2, RequestStatus.Fulfilled);
        vm.stopPrank();

        // Bob tries to pay fulfilled request, fails
        vm.startPrank(BOB, BOB);
        token.approve(address(daimoRequest), 420);
        vm.expectRevert("Request already fulfilled or cancelled");
        daimoRequest.fulfillRequest(2);
        vm.stopPrank();

        // Alice tries to mark paid request pending again, fails
        vm.startPrank(ALICE, ALICE);
        vm.expectRevert("Request already fulfilled or cancelled");
        daimoRequest.updateRequest(2, RequestStatus.Pending);
        vm.stopPrank();

        // Check no transfer went through
        assertEq(token.balanceOf(ALICE), 0);
        assertEq(token.balanceOf(BOB), 1000);
        assertEq(token.balanceOf(address(daimoRequest)), 0);
    }

    function testMultipleRequests() public {
        token.mint(BOB, 2000);

        // Creates a new request of 500 DAI to ALICE
        _createRequestAlice(1, 500);

        // Creates a new request of 1000 DAI to ALICE
        _createRequestAlice(2, 1000);

        // Creates a new request of 42 DAI to ALICE
        _createRequestAlice(3, 42);

        // Bob fulfills the first request, emits event
        _fulfillRequestBob(1, 500);

        // Bob fulfills the second request, emits event
        _fulfillRequestBob(2, 1000);

        // Alice marks the third request as paid independently, emits event
        vm.expectEmit(false, false, false, false);
        vm.startPrank(ALICE, ALICE);
        emit DaimoRequest.RequestFulfilled(3, ALICE);
        daimoRequest.updateRequest(3, RequestStatus.Fulfilled);
        vm.stopPrank();

        // Check transfers went through correctly
        assertEq(token.balanceOf(ALICE), 1500);
        assertEq(token.balanceOf(BOB), 500);
        assertEq(token.balanceOf(address(daimoRequest)), 0);
    }
}
