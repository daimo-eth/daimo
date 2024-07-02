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
 * @title ICCTPReceiver
 * @notice Receives messages on destination chain and forwards them to IMessageDestinationHandler
 */
interface ICCTPReceiver {
  /**
   * @notice Receives an incoming message, validating the header and passing
   * the body to application-specific handler.
   * @param message The message raw bytes
   * @param signature The message signature
   * @return success bool, true if successful
   */
  function receiveMessage(
    bytes calldata message,
    bytes calldata signature
  ) external returns (bool success);
}
