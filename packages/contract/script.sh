# Build
forge build
# Deploy
forge script script/Deploy.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
# Verify
forge script script/Deploy.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --verify --etherscan-api-key $ETHERSCAN_API_KEY
# New Account
forge script script/NewAccount.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
# Testing script
forge script script/Testing.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY
# Create calldata for UserOp for bundler
cast cd "execute(address,uint256,bytes)" 0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB 10000000000000000 0x

# Deploy name registry
forge script script/DeployNameRegistry.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy Test USDC
# forge script script/DeployTestUSDC.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy Ephemeral Notes using Test USDC
forge script script/DeployEphemeralNotes.s.sol --sig "run(address)" "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf" --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY