// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./SnacDepositAddress.sol";
import "@openzeppelin-contracts-5.0.2/token/ERC20/IERC20.sol";
import "@openzeppelin-contracts-5.0.2/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin-contracts-5.0.2/access/Ownable.sol";

contract Snac is DepositAddressExt, Ownable {
    using SafeERC20 for IERC20;

    /// @notice Verifier for “sendTokenIn” proofs
    Verifier public sendTokenInVerifier;

    /// @notice Verifier for “sendTokenOut” proofs
    Verifier public sendTokenOutVerifier;

    constructor(address _inVerifier, address _outVerifier, address owner) Ownable(owner) {
        sendTokenInVerifier = Verifier(_inVerifier);
        sendTokenOutVerifier = Verifier(_outVerifier);
    }

    mapping(bytes32 => bool) public IsUtxoCommitmentsSpendable;

    function createDepositAddress(
        string memory depositAddress,
        bytes32 commitment,
        bytes32 publicKey,
        bytes32 signedPrivateKey,
        bytes32 vaultHash
    ) public {
        _createDepositAddress(depositAddress, commitment, publicKey, signedPrivateKey, vaultHash);
    }

    function associateTransferWithDepositAddress(
        bytes32 utxoCommitment,
        bytes32 depositHash,
        bytes1[116] calldata utxoBytes
    ) public onlyOwner {
        // validate transaction event

        // create and save utxo
        IsUtxoCommitmentsSpendable[utxoCommitment] = true;
        utxoInfo[depositHash][utxoInfo[depositHash].length - 1] = utxoBytes;
    }

    function sendTokenOut(bytes calldata _proof, bytes32[] memory _publicInputs, address receiverAddress) public {
        Bytes32Parser.SendOutCommitments memory public_inputs =
            Bytes32Parser.parseSendOutCommitmentsStruct(_publicInputs);

        for (uint256 i = 0; i < public_inputs.utxoCommitments.length; i++) {
            require(
                IsUtxoCommitmentsSpendable[public_inputs.utxoCommitments[i]] == true, "utxo is spended or not found"
            );
            IsUtxoCommitmentsSpendable[public_inputs.utxoCommitments[i]] = false;
        }

        for (uint256 i = 0; i < public_inputs.ownershipCommitments.length; i++) {
            require(depositAddressCommitments[public_inputs.ownershipCommitments[i]] == true);
        }

        assert(sendTokenOutVerifier.verify(_proof, _publicInputs));

        IsUtxoCommitmentsSpendable[public_inputs.output] = true;
        utxoInfo[public_inputs.depositHash][utxoInfo[public_inputs.depositHash].length - 1] = public_inputs.utxoData;

        IERC20(public_inputs.contractAddress).safeTransfer(receiverAddress, public_inputs.sendAmount);
    }

    function sendTokenIn(bytes calldata _proof, bytes32[] memory _publicInputs) public {
        Bytes32Parser.SendInCommitments memory public_inputs = Bytes32Parser.parseSendInCommitmentsStruct(_publicInputs);

        for (uint256 i = 0; i < public_inputs.utxoCommitments.length; i++) {
            require(
                IsUtxoCommitmentsSpendable[public_inputs.utxoCommitments[i]] == true, "utxo is spended or not found"
            );
            IsUtxoCommitmentsSpendable[public_inputs.utxoCommitments[i]] = false;
        }

        for (uint256 i = 0; i < public_inputs.ownershipCommitments.length; i++) {
            require(depositAddressCommitments[public_inputs.ownershipCommitments[i]] == true);
        }

        assert(sendTokenInVerifier.verify(_proof, _publicInputs));

        IsUtxoCommitmentsSpendable[public_inputs.output[0]] = true;
        IsUtxoCommitmentsSpendable[public_inputs.output[1]] = true;
        utxoInfo[public_inputs.depositHashes[0]][utxoInfo[public_inputs.depositHashes[0]].length - 1] =
            public_inputs.utxoData[0];
        utxoInfo[public_inputs.depositHashes[1]][utxoInfo[public_inputs.depositHashes[1]].length - 1] =
            public_inputs.utxoData[1];
    }
}

interface Verifier {
    function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool);
}

library Bytes32Parser {
    /// @dev Holds all the parsed fields together.
    struct SendOutCommitments {
        bytes32[3] utxoCommitments;
        bytes32[3] ownershipCommitments;
        address contractAddress;
        uint256 sendAmount;
        bytes32 depositHash;
        bytes32 output;
        bytes1[116] utxoData;
    }

    struct SendInCommitments {
        bytes32[3] utxoCommitments;
        bytes32[3] ownershipCommitments;
        bytes32[2] depositHashes;
        bytes32[2] output;
        bytes1[116][2] utxoData;
    }

    function parseSendInCommitmentsStruct(bytes32[] memory data) public pure returns (SendInCommitments memory) {
        require(data.length == 552);

        bytes32[3] memory utxoCommitments;
        bytes32[3] memory ownershipCommitments;
        bytes32[2] memory depositHashes;
        bytes32[2] memory output;
        bytes1[116][2] memory utxoData;

        for (uint16 o = 0; o < 3; o++) {
            for (uint256 i = 0; i < 32; i++) {
                utxoCommitments[o] |= bytes32(data[32 * o + i]) >> (8 * i);
            }
        }

        for (uint8 o = 0; o < 3; o++) {
            for (uint256 i = 0; i < 32; i++) {
                ownershipCommitments[o] |= bytes32(data[32 * (3 + o) + i]) >> (8 * i);
            }
        }

        for (uint16 o = 0; o < 2; o++) {
            for (uint256 i = 0; i < 32; i++) {
                depositHashes[o] |= bytes32(data[32 * (6 + o) + i]) >> (8 * i);
            }
        }

        for (uint16 o = 0; o < 2; o++) {
            for (uint256 i = 0; i < 32; i++) {
                output[o] |= bytes32(data[32 * (8 + o) + i]) >> (8 * i);
            }
        }

        for (uint16 o = 0; o < 2; o++) {
            for (uint256 i = 0; i < 116; i++) {
                utxoData[o][i] = bytes1(data[320 + o * 116 + i]);
            }
        }

        return SendInCommitments(utxoCommitments, ownershipCommitments, depositHashes, output, utxoData);
    }

    function parseSendOutCommitmentsStruct(bytes32[] memory data) public pure returns (SendOutCommitments memory) {
        require(data.length == 424); // total elements :contentReference[oaicite:3]{index=3}

        bytes32[3] memory utxoCommitments;
        bytes32[3] memory ownershipCommitments;
        bytes20 contractAddress;
        bytes32 sendAmount;
        bytes32 depositHash;
        bytes32 output;
        bytes1[116] memory utxoData;

        for (uint8 o = 0; o < 3; o++) {
            for (uint256 i = 0; i < 32; i++) {
                utxoCommitments[o] |= bytes32(data[32 * o + i]) >> (8 * i);
            }
        }

        for (uint8 o = 0; o < 3; o++) {
            for (uint256 i = 0; i < 32; i++) {
                ownershipCommitments[o] |= bytes32(data[32 * (3 + o) + i]) >> (8 * i);
            }
        }

        for (uint256 i = 0; i < 20; i++) {
            contractAddress |= bytes20(data[192 + i]) >> (8 * i);
        }

        for (uint256 i = 0; i < 32; i++) {
            sendAmount |= bytes32(data[212 + i]) >> (8 * i);
        }

        for (uint256 i = 0; i < 32; i++) {
            depositHash |= bytes32(data[244 + i]) >> (8 * i);
        }

        for (uint256 i = 0; i < 32; i++) {
            output |= bytes32(data[276 + i]) >> (8 * i);
        }

        for (uint256 i = 0; i < 116; i++) {
            utxoData[i] = bytes1(data[308 + i]);
        }

        return SendOutCommitments(
            utxoCommitments,
            ownershipCommitments,
            address(contractAddress),
            uint256(sendAmount),
            depositHash,
            output,
            utxoData
        );
    }
}
