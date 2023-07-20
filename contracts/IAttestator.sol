// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.18;

interface IAttestator {
    enum VerificationRank {
        NONE,
        NON_STATE,
        STATE
    }
    //Schema typed data record
    struct SchemaRecord {
        bytes data;
        uint256 expiredAt;
    }

    //Dynamic typed data record
    struct DynamicData {
        bytes data;
        string typeName;
        string name;
    }

    struct DynamicRecord {
        DynamicData[] data;
        uint256 expiredAt;
    }

    struct SchemaElement {
        string name;
        string dataType;
        SchemaElement[] childs;
    }

    function addEntity(string memory name) external;

    function removeEntity() external;

    function addEntitySchema(
        string memory name,
        bytes[] memory schema
    ) external;

    function removeEntitySchema(bytes32 schemaHash) external;

    function attestTyped(
        address entity,
        address subject,
        bytes32 schemaHash,
        bytes memory data,
        uint256 expiredAt,
        bytes memory entitySignature
    ) external;

    function attestDynamic(
        address subject,
        string memory key,
        DynamicData[] memory data,
        uint256 expiredAt
    ) external;

    event EntityAdded(
        address indexed entityAddress,
        string entityName,
        uint256 timestamp
    );

    event EntityRemoved(address indexed entityAddress, uint256 timestamp);

    event EntitySchemaAdded(
        address indexed entityAddress,
        bytes32 indexed schemaHash,
        uint256 timestamp
    );

    event EntitySchemaRemoved(
        address indexed entityAddress,
        bytes32 indexed schemaHash,
        uint256 timestamp
    );

    event TypedAttestation(
        address indexed entity,
        address indexed subject,
        bytes32 indexed schemaHash,
        bytes32 dataHash,
        uint256 expiredAt,
        uint256 timestamp
    );
    event DynamicAttestation(
        address indexed claimer,
        address indexed subject,
        string indexed key,
        bytes32 dataHash,
        uint256 expiredAt,
        uint256 timestamp
    );

    event TypedAttestationRevoked(
        address indexed entity,
        address indexed subject,
        bytes32 indexed schemaHash,
        uint256 timestamp
    );

    event DynamicAttestationRevoked(
        address indexed claimer,
        address indexed subject,
        string indexed key,
        uint256 timestamp
    );
}
