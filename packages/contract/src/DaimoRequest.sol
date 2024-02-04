// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

enum RequestStatus {
    Pending,
    Fulfilled,
    Cancelled
}

struct Request {
    address recipient;
    uint256 amount;
    RequestStatus status;
}

/**
 * @notice A simple forwarding contract that allows users to create requests for
 * funds and track if they have been fulfilled.
 */
contract DaimoRequest {
    using SafeERC20 for IERC20;

    mapping(uint256 => Request) public requests; // map from ID to requests
    IERC20 public token;

    event RequestCreated(
        uint256 id,
        address recipient,
        address creator,
        uint256 amount,
        bytes metadata
    );
    event RequestCancelled(uint256 id, address canceller);
    event RequestFulfilled(uint256 id, address fulfiller);

    // Stablecoin token to use for requests, or 0x0 for USDC.
    // This allows us to CREATE2-deploy this contract at the same address
    // on different chains.
    constructor(IERC20 _token) {
        uint256 chainId = block.chainid;
        if (address(_token) != address(0)) {
            token = _token;
        } else if (chainId == 8453) {
            // Base USDC
            token = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
        } else if (chainId == 84532) {
            // Base Sepolia testnet USDC
            token = IERC20(0x036CbD53842c5426634e7929541eC2318f3dCF7e);
        } else {
            revert("EphemeralNotes: unknown chain and no token specified");
        }
    }

    // Anyone can create a request on behalf of recipient
    // It's up to the clients to filter spam requests.
    function createRequest(
        uint256 id,
        address recipient,
        uint256 amount,
        bytes calldata metadata // optional metadata, interpreted off-chain only
    ) public {
        Request memory request = requests[id];
        require(request.recipient == address(0), "Request already exists");
        require(recipient != address(0), "Must specify recipient");

        requests[id] = Request({
            recipient: recipient,
            amount: amount,
            status: RequestStatus.Pending
        });
        emit RequestCreated(id, recipient, msg.sender, amount, metadata);
    }

    // Only the recipient can update the request from pending to
    // fulfilled or cancelled.
    function updateRequest(uint256 id, RequestStatus status) public {
        Request memory request = requests[id];
        require(request.recipient != address(0), "Request does not exist");
        require(
            request.status == RequestStatus.Pending,
            "Request already fulfilled or cancelled"
        );
        require(
            status == RequestStatus.Cancelled ||
                status == RequestStatus.Fulfilled,
            "Invalid update"
        );
        require(msg.sender == request.recipient, "Not request recipient");

        requests[id].status = status;
        if (status == RequestStatus.Cancelled)
            emit RequestCancelled(id, msg.sender);
        else emit RequestFulfilled(id, msg.sender);
    }

    // Call token.approve(<address of this contract>, amount) on the token
    // contract before this call.
    // Anyone can fulfill the request, only once.
    function fulfillRequest(uint256 id) public {
        Request memory request = requests[id];
        require(request.recipient != address(0), "Request does not exist");
        require(
            request.status == RequestStatus.Pending,
            "Request already fulfilled or cancelled"
        );

        requests[id].status = RequestStatus.Fulfilled;
        emit RequestFulfilled(id, msg.sender);
        token.safeTransferFrom(msg.sender, request.recipient, request.amount);
    }
}
