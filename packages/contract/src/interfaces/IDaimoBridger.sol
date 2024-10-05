import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// Bridges assets automatically. Specifically, it lets any market maker
/// initiate a bridge transaction to another chain.
interface IDaimoBridger {
    function sendToChain(
        IERC20 tokenIn,
        uint256 amountIn,
        uint256 toChainId,
        bytes calldata extraData
    ) external;
}
