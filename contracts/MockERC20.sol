pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


// Token with Governance.
contract MockERC20 is ERC20('MockERC20', 'Mock'), Ownable{

    //Initialize Token name, symbol, decimal and totalsupply 
    constructor () public {
      
    }

    function burn(uint256 _value) public onlyOwner {
        _burn(msg.sender,_value);
    }

    function mint(address _account, uint256 _value) public onlyOwner returns(bool) {
        _mint(_account, _value);
        return true;
    }
}
