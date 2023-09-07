# Build
forge build

# Deploy P256SHA256 singleton
forge script script/DeployP256SHA256.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy Account factory
forge script script/DeployAccountFactory.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Create calldata for UserOp for bundler
cast cd "execute(address,uint256,bytes)" 0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB 10000000000000000 0x

# Deploy name registry
forge script script/DeployNameRegistry.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy Ephemeral Notes using Test USDC
forge script script/DeployEphemeralNotes.s.sol --sig "run(address)" "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf" --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy test Account and verify it on Etherscan
forge script script/DeployTestAccount.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY