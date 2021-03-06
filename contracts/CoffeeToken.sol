pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract CoffeeToken is ERC20("CafeSwap Token", "BREW") {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public governance;
    address[] public listOfMinters;

    mapping(address => bool) public minters;

    uint256 public cap;

    event MinterChanged(address indexed minter, bool role);

    constructor(uint256 _cap) public {
        cap = _cap;
        governance = msg.sender;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "!governance");
        _;
    }

    modifier onlyMinter() {
        require(
            msg.sender == governance || minters[msg.sender],
            "!governance && !minter"
        );
        _;
    }

    function getGetMinter(uint256 _pid) public view returns (address) {
        return listOfMinters[_pid];
    }

    function mint(address _to, uint256 _amount) external onlyMinter {
        _mint(_to, _amount);
    }

    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
    }

    function burnFrom(address _account, uint256 _amount) external {
        uint256 decreasedAllowance = allowance(_account, msg.sender).sub(
            _amount,
            "ERC20: burn amount exceeds allowance"
        );
        _approve(_account, msg.sender, decreasedAllowance);
        _burn(_account, _amount);
    }

    function setGovernance(address _governance) external onlyGovernance {
        governance = _governance;
    }

    function addMinter(address _minter) external onlyGovernance {
        minters[_minter] = true;
        listOfMinters.push(_minter);
        emit MinterChanged(_minter, true);
    }

    function removeMinter(address _minter) external onlyGovernance {
        minters[_minter] = false;
        emit MinterChanged(_minter, false);
    }

    function setCap(uint256 _cap) external onlyGovernance {
        require(_cap >= totalSupply(), "_cap is below current total supply");
        cap = _cap;
    }

    /**
     * @dev See {ERC20-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - minted tokens must not cause the total supply to go over the cap.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        if (from == address(0)) {
            // When minting tokens
            require(
                totalSupply().add(amount) <= cap,
                "ERC20Capped: cap exceeded"
            );
        }
    }

    // This function allows governance to take unsupported tokens out of the contract. This is in an effort to make someone whole, should they seriously mess up.
    // There is no guarantee governance will vote to return these. It also allows for removal of airdropped tokens.
    function governanceRecoverUnsupported(
        IERC20 _token,
        address _to,
        uint256 _amount
    ) external onlyGovernance {
        _token.safeTransfer(_to, _amount);
    }
}
