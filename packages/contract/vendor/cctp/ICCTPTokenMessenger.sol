/*
 * Copyright (c) 2022, Circle Internet Financial Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
pragma solidity ^0.8.12;

/**
 * @title ICCTPTokenMessenger
 * @notice Initiates CCTP transfers. Interface derived from TokenMessenger.sol.
 */
interface ICCTPTokenMessenger {
  /**
   * @notice Deposits and burns tokens from sender to be minted on destination domain.
   * Emits a `DepositForBurn` event.
   * @dev reverts if:
   * - given burnToken is not supported
   * - given destinationDomain has no TokenMessenger registered
   * - transferFrom() reverts. For example, if sender's burnToken balance or approved allowance
   * to this contract is less than `amount`.
   * - burn() reverts. For example, if `amount` is 0.
   * - MessageTransmitter returns false or reverts.
   * @param amount amount of tokens to burn
   * @param destinationDomain destination domain
   * @param mintRecipient address of mint recipient on destination domain
   * @param burnToken address of contract to burn deposited tokens, on local domain
   * @return _nonce unique nonce reserved by message
   */
  function depositForBurn(
    uint256 amount,
    uint32 destinationDomain,
    bytes32 mintRecipient,
    address burnToken
  ) external returns (uint64 _nonce);
}
