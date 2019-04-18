pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "@daonuts/token-manager/contracts/TokenManager.sol";
import "@daonuts/common/contracts/INames.sol";

contract Distribution is AragonApp {
    using SafeMath for uint256;

    struct Distribution {
      bool active;
      mapping(bytes32 => bool) claimed;
    }

    /// Events
    event DistributionStarted(bytes32 root);
    event UserAwarded(bytes32 root, string username, uint award);

    /// State
    bytes32[] public roots;
    mapping(bytes32 => Distribution) public distributions;
    /* AbstractENS public ens; */
    INames public names;
    TokenManager public tokenManager;
    TokenManager public karmaManager;

    /// ACL
    bytes32 constant public START_DISTRIBUTION = keccak256("START_DISTRIBUTION");

    // Errors
    string private constant DISTRIBUTION_EXISTS = "DISTRIBUTION_EXISTS";
    string private constant NO_ACTIVE_DISTRIBUTION = "NO_ACTIVE_DISTRIBUTION";
    string private constant USER_HAS_COLLECTED = "USER_HAS_COLLECTED";
    string private constant USER_NOT_REGISTERED = "USER_NOT_REGISTERED";
    string private constant INVALID = "INVALID";

    function initialize(INames _names, TokenManager _tokenManager, TokenManager _karmaManager, bytes32 _root) onlyInit public {
        initialized();

        names = _names;
        tokenManager = _tokenManager;
        karmaManager = _karmaManager;
        _addRoot(_root);
    }

    /**
     * @notice Propose a new distribution merkle root
     * @param _root New distribution merkle root
     */
    function addRoot(bytes32 _root) auth(START_DISTRIBUTION) external {
        require( distributions[_root].active == false, DISTRIBUTION_EXISTS );
        _addRoot(_root);
    }

    function _addRoot(bytes32 _root) internal {
        roots.push(_root);
        Distribution storage distribution = distributions[_root];
        distribution.active = true;
        emit DistributionStarted(_root);
    }

    /**
     * @notice Award from distribution
     * @param _root New distribution merkle root
     * @param _proof Merkle proof to correspond to data supplied
     * @param _username Username recepient of award
     * @param _award The award amount
     */
    function award(bytes32 _root, string _username, uint256 _award, bytes32[] _proof) external {
        address recipient = names.ownerOfName(_username);
        require( recipient != address(0), USER_NOT_REGISTERED );
        require( distributions[_root].active == true, NO_ACTIVE_DISTRIBUTION );
        bytes32 nameHash = keccak256(_username);
        require( distributions[_root].claimed[nameHash] == false, USER_HAS_COLLECTED );
        require( validate(_root, _username, _award, _proof), INVALID );
        distributions[_root].claimed[nameHash] = true;
        // do award user TODO

        tokenManager.mint(recipient, _award);
        karmaManager.mint(recipient, _award);

        //emit UserAwarded(_root, recipient, _award);
        emit UserAwarded(_root, _username, _award);
    }

    function claimed(bytes32 _root, string _username) public view returns(bool) {
      return distributions[_root].claimed[keccak256(_username)];
    }

    /**
     * @notice Get length of roots array
     */
    function getRootsCount() public view returns(uint count) {
        return roots.length;
    }

    function validate(
      bytes32 _root, string _username, uint256 _award, bytes32[] _proof
    ) public view returns (bool) {
        bytes32 hash = keccak256(_username, _award);
        return checkProof(_root, _proof, hash);
    }

    function hash(string _username, uint256 _award) public view returns (bytes32 hash) {
        hash = keccak256(_username, _award);
    }

    function hashAddress(address _address) public view returns (bytes32 hash) {
        hash = keccak256(_address);
    }

    function checkProof(bytes32 root, bytes32[] proof, bytes32 hash) public pure returns (bool) {

        for (uint i = 0; i < proof.length; i++) {
            if (hash < proof[i]) {
                hash = keccak256(hash, proof[i]);
            } else {
                hash = keccak256(proof[i], hash);
            }
        }

        return hash == root;
    }
}
