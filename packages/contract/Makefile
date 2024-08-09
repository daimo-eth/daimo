build:
	forge install
	forge build

clean:
	rm -rf out lib

full:
	make clean
	make build

.PHONY: test
test:
	$(eval BASE_MAINNET_RPC ?= $(or $(BASE_MAINNET_RPC),https://base-rpc.publicnode.com)) # Use environment variable if set, otherwise use default
	@echo Running tests with RPC: $(BASE_MAINNET_RPC)
	forge test -vvv --fork-url "$(BASE_MAINNET_RPC)" --no-match-path "test/uniswap/*"
	forge test -vvv --fork-url "$(BASE_MAINNET_RPC)" --fork-block-number 14513720 --match-path "test/uniswap/*" --no-match-path "test/uniswap/Quoter.t.sol"
	forge test -vvv --fork-url "$(BASE_MAINNET_RPC)" --fork-block-number 15950101 --match-path "test/uniswap/Quoter.t.sol"

coverage:
	$(eval BASE_MAINNET_RPC ?= $(or $(BASE_MAINNET_RPC),https://base-rpc.publicnode.com)) # Use environment variable if set, otherwise use default
	@echo Running tests with RPC: $(BASE_MAINNET_RPC)
	forge coverage --report lcov --fork-url "$(BASE_MAINNET_RPC)" --no-match-path "test/uniswap/*"
	forge coverage --report lcov --fork-url "$(BASE_MAINNET_RPC)" --fork-block-number 14513720 --match-path "test/uniswap/*" --no-match-path "test/uniswap/Quoter.t.sol"
	forge coverage --report lcov --fork-url "$(BASE_MAINNET_RPC)" --fork-block-number 15950101 --match-path "test/uniswap/Quoter.t.sol"

codegen:
	make build
	cd ../.. && npm ci && npm run codegen
