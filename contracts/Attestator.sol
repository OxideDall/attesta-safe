// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.18;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IAttestator} from "./IAttestator.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Error, Roles} from "./Constants.sol";
import {SchemaLib} from "./lib/Schema.sol";
import {DecodeValidator} from "./lib/DecodeValidator.sol";
import {ListMap} from "./lib/ListMap.sol";

contract Attestator is IAttestator, AccessControl {
    //ATTESTATIONS WITH SCHEMA
    //Schema hash to schema struct
    mapping(bytes32 => SchemaElement[]) internal _schemas;
    mapping(bytes32 => string) internal _schemaName;
    mapping(address => ListMap._bytes32) internal _entitySchemas;
    //Hashing buffer
    SchemaElement[] internal _buffer;

    //Schema => data decoders
    mapping(string => function(bytes memory) internal pure)
        internal typeDecoders;
    //DataType name allowed
    mapping(string => bool) internal _typeAllowed;

    //Entity => schema => subject => record
    mapping(address => mapping(bytes32 => mapping(address => SchemaRecord)))
        internal schemaTypedAttestations;

    //RELATIONS
    //Typed relations
    mapping(address => ListMap._address) internal _userTypedAttestors;
    mapping(address => ListMap._address) internal _attestorTypedUsers;

    //Dynamic relations
    //Relation from attestor to entity
    mapping(address => ListMap._address) internal _attestorDynamicUsers;
    mapping(address => ListMap._address) internal _userDynamicAttestors;

    //Entity to entity claims
    mapping(address => mapping(address => string[]))
        internal _attestorToUserToClaims;

    //Relation from entity to attestors

    //DYANMIC DATA

    // Dynamicly typed data records
    mapping(address => mapping(address => mapping(string => DynamicRecord)))
        internal _dynamiclyTypedAttestations;

    //Entity properties
    mapping(address => string) public entityName;
    mapping(string => bool) public nameAllocated;
    mapping(address => VerificationRank) public entityVerificationRank;

    using ECDSA for bytes32;
    using SchemaLib for SchemaElement;
    using SchemaLib for SchemaElement[];
    using ListMap for ListMap._address;
    using ListMap for ListMap._bytes32;

    using DecodeValidator for mapping(string => function(bytes memory)
        internal
        pure);

    constructor(address attestationManager) {
        _grantRole(Roles.ATTESTATION_MANAGER, attestationManager);
        _setRoleAdmin(Roles.ATTESTATION_MANAGER, Roles.ATTESTATION_MANAGER);
        typeDecoders.init(_typeAllowed);
    }

    function addEntity(string memory name) external {
        require(bytes(name).length > 0, Error.ZERO_VALUE);

        require(
            bytes(entityName[msg.sender]).length == 0,
            Error.ELEMENT_EXISTS
        );

        require(!nameAllocated[name], Error.ELEMENT_EXISTS);

        entityName[msg.sender] = name;
        nameAllocated[name] = true;
        emit EntityAdded(msg.sender, name, block.timestamp);
    }

    function removeEntity() external {
        require(nameAllocated[entityName[msg.sender]], Error.NOT_EXISTS);

        nameAllocated[entityName[msg.sender]] = false;

        delete entityName[msg.sender];

        delete _entitySchemas[msg.sender];

        delete _attestorTypedUsers[msg.sender];

        emit EntityRemoved(msg.sender, block.timestamp);
    }

    function getEntitySchemaHashes(
        address entityAddress
    ) external view returns (bytes32[] memory) {
        return _entitySchemas[entityAddress].list;
    }

    function getSchema(
        bytes32 schemaHash
    ) external view returns (string memory, bytes[] memory) {
        return (_schemaName[schemaHash], _schemas[schemaHash].encodeSchema());
    }

    function getDynamicAttestation(
        address claimer,
        address subject,
        string memory key
    ) external view returns (DynamicRecord memory) {
        return _dynamiclyTypedAttestations[claimer][subject][key];
    }

    function getAttestorToUserClaims(
        address claimer,
        address subject
    ) external view returns (string[] memory) {
        return _attestorToUserToClaims[claimer][subject];
    }

    function getTypedAttestation(
        address entity,
        address subject,
        bytes32 schemaHash
    ) external view returns (SchemaRecord memory) {
        return schemaTypedAttestations[entity][schemaHash][subject];
    }

    function getUserTypedAttestors(
        address user
    ) external view returns (address[] memory) {
        return _userTypedAttestors[user].list;
    }

    function getUserDynamicAttestors(
        address user
    ) external view returns (address[] memory) {
        return _userDynamicAttestors[user].list;
    }

    function getAttestorTypedUsers(
        address entity
    ) external view returns (address[] memory) {
        return _attestorTypedUsers[entity].list;
    }

    function getAttestorDynamicUsers(
        address entity
    ) external view returns (address[] memory) {
        return _attestorDynamicUsers[entity].list;
    }

    function attestorHasSchema(
        address attestor,
        bytes32 schemaHash
    ) external view returns (bool) {
        return _entitySchemas[attestor].includes[schemaHash];
    }

    function addEntitySchema(
        string memory name,
        bytes[] memory schemaBytes
    ) external {
        require(nameAllocated[entityName[msg.sender]], Error.ENTITY_ACCESS);
        require(bytes(name).length > 0, Error.ZERO_VALUE);

        SchemaElement[] storage schemaPointer = _buffer;

        bytes32 schemaHash = schemaPointer.addSchema(schemaBytes);

        if (_schemas[schemaHash].length == 0) {
            _schemas[schemaHash] = schemaPointer;
        }
        _schemaName[schemaHash] = name;
        _entitySchemas[msg.sender].add(schemaHash);

        delete _buffer;

        emit EntitySchemaAdded(msg.sender, schemaHash, block.timestamp);
    }

    function removeEntitySchema(bytes32 schemaHash) external {
        address[] memory attestorUsers = _attestorTypedUsers[msg.sender].list;

        delete _schemaName[schemaHash];

        for (uint i = 0; i < attestorUsers.length; i++) {
            if (
                schemaTypedAttestations[msg.sender][schemaHash][
                    attestorUsers[i]
                ].data.length > 0
            ) {
                revert(Error.SCHEMA_IN_USE);
            }
        }

        _entitySchemas[msg.sender].remove(schemaHash);

        emit EntitySchemaRemoved(msg.sender, schemaHash, block.timestamp);
    }

    function attestTyped(
        address entity,
        address subject,
        bytes32 schemaHash,
        bytes memory data,
        uint256 expiredAt,
        bytes memory entitySignature
    ) external {
        require(data.length > 0, Error.ZERO_VALUE);

        if (entitySignature.length == 0) {
            entity = msg.sender;
        }

        require(
            _entitySchemas[entity].includes[schemaHash],
            Error.ENTITY_SCHEMA_NOT_FOUND
        );

        require(
            expiredAt > block.timestamp || expiredAt == 0,
            Error.ATTESTATION_INVALID_EXPIRATION
        );

        bytes32 dataHash = keccak256(
            abi.encodePacked(abi.encode(subject), expiredAt, keccak256(data))
        );

        if (entitySignature.length > 0) {
            require(
                dataHash.toEthSignedMessageHash().recover(entitySignature) ==
                    entity,
                Error.ENTITY_INVALID_SIGNATURE
            );
        }

        _schemas[schemaHash].validateSchema(data, typeDecoders);

        schemaTypedAttestations[entity][schemaHash][subject] = SchemaRecord(
            data,
            expiredAt
        );

        _userTypedAttestors[subject].add(entity);
        _attestorTypedUsers[entity].add(subject);

        emit TypedAttestation(
            entity,
            subject,
            schemaHash,
            dataHash,
            expiredAt,
            block.timestamp
        );
    }

    function revokeTyped(address subject, bytes32 schemaHash) external {
        SchemaRecord storage p = schemaTypedAttestations[msg.sender][
            schemaHash
        ][subject];

        require(p.data.length > 0, Error.ZERO_VALUE);

        delete schemaTypedAttestations[msg.sender][schemaHash][subject];

        bytes32[] memory schemas = _entitySchemas[msg.sender].list;
        for (uint i; i < schemas.length; i++) {
            if (
                schemaTypedAttestations[msg.sender][schemas[i]][subject]
                    .data
                    .length > 0
            ) break;

            if (i == schemas.length - 1) {
                _attestorTypedUsers[msg.sender].remove(subject);
                _userTypedAttestors[subject].remove(msg.sender);
            }
        }

        emit TypedAttestationRevoked(
            msg.sender,
            subject,
            schemaHash,
            block.timestamp
        );
    }

    function attestDynamic(
        address subject,
        string memory key,
        DynamicData[] memory data,
        uint256 expiredAt
    ) external {
        require(bytes(key).length > 0, Error.ZERO_VALUE);

        require(data.length > 0, Error.ZERO_VALUE);

        require(
            expiredAt > block.timestamp || expiredAt == 0,
            Error.ATTESTATION_INVALID_EXPIRATION
        );

        DynamicRecord storage record = _dynamiclyTypedAttestations[msg.sender][
            subject
        ][key];

        require(record.data.length == 0, Error.ELEMENT_EXISTS);

        for (uint i; i < data.length; i++) {
            require(data[i].data.length > 0, Error.ZERO_VALUE);

            require(
                _typeAllowed[data[i].typeName],
                Error.DATA_TYPE_NOT_ALLOWED
            );

            require(bytes(data[i].name).length > 0, Error.ZERO_VALUE);

            DynamicData storage slot = record.data.push();

            slot.data = data[i].data;
            slot.typeName = data[i].typeName;
            slot.name = data[i].name;
        }

        _attestorDynamicUsers[msg.sender].add(subject);
        _userDynamicAttestors[subject].add(msg.sender);

        _attestorToUserToClaims[msg.sender][subject].push(key);

        emit DynamicAttestation(
            msg.sender,
            subject,
            key,
            keccak256(abi.encode(data)),
            expiredAt,
            block.timestamp
        );
    }

    function revokeDynamic(address subject, string memory key) external {
        require(bytes(key).length > 0, Error.ZERO_VALUE);

        DynamicRecord storage record = _dynamiclyTypedAttestations[msg.sender][
            subject
        ][key];

        require(record.data.length > 0, Error.ZERO_VALUE);

        delete _dynamiclyTypedAttestations[msg.sender][subject][key];

        string[] storage keys = _attestorToUserToClaims[msg.sender][subject];

        for (uint i; i < keys.length; i++) {
            if (keccak256(bytes(keys[i])) == keccak256(bytes(key))) {
                keys[i] = keys[keys.length - 1];
                keys.pop();
                break;
            }
        }

        if (keys.length == 0) {
            _attestorDynamicUsers[msg.sender].remove(subject);
        }

        emit DynamicAttestationRevoked(
            msg.sender,
            subject,
            key,
            block.timestamp
        );
    }

    function verifyEntity(
        address entity,
        VerificationRank rank
    ) external onlyRole(Roles.ATTESTATION_MANAGER) {
        require(bytes(entityName[entity]).length > 0, Error.NOT_EXISTS);
        entityVerificationRank[entity] = rank;
    }
}
