// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SignatureRegistry
 * @dev On-chain verification registry for SignatureCheck on BOT Chain.
 * 
 * IMPORTANT ARCHITECTURAL & TRUST MODEL NOTE:
 * This registry records that an authorized wallet address (msg.sender) has published
 * an active verification record with an associated verification message hash and timestamp.
 * In this design, cryptographic signature verification (EIP-712 / EIP-191) is performed
 * securely off-chain by clients prior to submitting this transaction, ensuring zero replay
 * across uncoordinated signers while eliminating unnecessary high gas costs.
 * 
 * The registry strictly guarantees:
 * 1. Only msg.sender can register or revoke records for their own wallet.
 * 2. An active record proves the wallet owner submitted this record at the recorded block timestamp.
 * 3. Any third party can inspect or query wallet verification states on BOT Chain.
 */
contract SignatureRegistry {
    struct VerificationRecord {
        bytes32 messageHash;
        uint256 timestamp;
        bool isActive;
    }

    // Mapping from wallet address to verification record
    mapping(address => VerificationRecord) private _verifications;

    // Emitted when a wallet registers a verification
    event VerificationRegistered(
        address indexed wallet,
        bytes32 indexed messageHash,
        uint256 timestamp
    );

    // Emitted when a wallet revokes its verification
    event VerificationRevoked(
        address indexed wallet,
        uint256 timestamp
    );

    // Custom errors
    error InvalidMessageHash();
    error AlreadyVerified();
    error NotVerified();

    /**
     * @notice Registers a verification record for the caller (msg.sender).
     * @param messageHash The cryptographic hash (e.g. EIP-712 or keccak256) of the verified message.
     */
    function registerVerification(bytes32 messageHash) external {
        if (messageHash == bytes32(0)) {
            revert InvalidMessageHash();
        }

        VerificationRecord storage record = _verifications[msg.sender];
        if (record.isActive && record.messageHash == messageHash) {
            revert AlreadyVerified();
        }

        record.messageHash = messageHash;
        record.timestamp = block.timestamp;
        record.isActive = true;

        emit VerificationRegistered(msg.sender, messageHash, block.timestamp);
    }

    /**
     * @notice Revokes the caller's active verification record.
     */
    function revokeVerification() external {
        VerificationRecord storage record = _verifications[msg.sender];
        if (!record.isActive) {
            revert NotVerified();
        }

        record.isActive = false;

        emit VerificationRevoked(msg.sender, block.timestamp);
    }

    /**
     * @notice Retrieves the verification record for a given wallet address.
     * @param wallet The wallet address to query.
     * @return messageHash The stored message hash.
     * @return timestamp The timestamp when the verification was recorded.
     * @return isActive True if the verification is currently active, false otherwise.
     */
    function getVerification(address wallet)
        external
        view
        returns (
            bytes32 messageHash,
            uint256 timestamp,
            bool isActive
        )
    {
        VerificationRecord storage record = _verifications[wallet];
        return (record.messageHash, record.timestamp, record.isActive);
    }

    /**
     * @notice Checks whether an active verification record exists for a given wallet address.
     * @param wallet The wallet address to check.
     * @return True if active, false otherwise.
     */
    function isVerified(address wallet) external view returns (bool) {
        return _verifications[wallet].isActive;
    }
}

