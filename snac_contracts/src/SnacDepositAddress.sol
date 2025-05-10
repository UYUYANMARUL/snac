// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

abstract contract DepositAddressExt {
    struct DepositInfo {
        bytes32 commitment;
        bytes32 publicKey;
        bytes32 signedPrivateKey;
    }

    struct DepositAddress {
        uint32 depositAddress;
        uint8 cycle;
        uint32 startBlock;
        uint32 endBlock;
    }

    // DepositCommitment => isExist
    mapping(bytes32 => bool) public depositAddressCommitments;

    mapping(bytes32 => DepositAddress) public depositAddress;

    // depositHash => DepositInfo
    mapping(bytes32 => DepositInfo) public depositProxy;

    // depositHash => Signed UTXO Info
    mapping(bytes32 => bytes1[][]) public utxoInfo;

    // hash of signed "vault" => depositHash[]
    mapping(bytes32 => bytes32[]) public vault;

    mapping(string => bool) reservedAddress;

    function getUtxoInfo(bytes32 key) external view returns (bytes1[][] memory) {
        return utxoInfo[key];
    }

    function getVault(bytes32 key) external view returns (bytes32[] memory) {
        return vault[key];
    }

    function _createDepositAddress(
        string memory depositAddress,
        bytes32 commitment,
        bytes32 publicKey,
        bytes32 signedPrivateKey,
        bytes32 vaultHash
    ) internal {
        bytes memory b = bytes(depositAddress);
        require(b.length == 6, "Address must be 6 digits");
        for (uint256 i = 0; i < b.length; i++) {
            require(b[i] >= 0x30 && b[i] <= 0x39, "Address must contain only digits");
        }

        //check is depositAddress is available

        require(!reservedAddress[depositAddress], "address is already taken");

        bytes32 depositHash = keccak256(abi.encodePacked(depositAddress));

        depositProxy[depositHash] = DepositInfo(commitment, publicKey, signedPrivateKey);

        vault[vaultHash].push(depositHash);

        depositAddressCommitments[commitment] = true;
        reservedAddress[depositAddress] = true;
    }
}

// uint256 randomAddress =
//             uint32(bytes4(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender)))) % 100000;

// there are three flowback currently utxo commitment and deposit hash connection is known because we are not using merkle tree to easily implement
// to reconstruct utxo we need to save someway utxo_bytes normall it will be saved ethereum with encryption but we cant use encryption in noir i could not find an implemantation because time limits i skipped and saved with raw format
// associateTransferWithDepositAddress function can just call by an admin currently because i could not prove the erc20 transfers i tried to reconstruct merkle patricia trie and get the leaf proof from that but each time i tried i get different root with the block receipent root so i skipped it
// i used u8 in noir circuit as an input so it is using unneccssary place and i need to decode these in solidity
