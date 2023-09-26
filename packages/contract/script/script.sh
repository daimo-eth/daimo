#!/bin/bash
set -e

# Build
forge build

# Stablecoin, Base Goerli testnet USDC
ADDR_TOKEN="0x1B85deDe8178E18CdE599B4C9d913534553C3dBf"


# Deploy Account factory
forge script script/DeployAccountFactory.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy name registry
forge script script/DeployNameRegistry.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy Ephemeral Notes using Test USDC
forge script script/DeployEphemeralNotes.s.sol --sig "run(address)" $ADDR_TOKEN --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# From DeployAccountFactory
ADDR_ACCOUNT_FACTORY="0x950b352C271B3a7799Ed71542Dc49c9333a6c2C3"

# Deploy test Account and verify it on Etherscan
forge script script/DeployTestAccount.s.sol --sig "run(address)" $ADDR_ACCOUNT_FACTORY --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY