// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.18;

import {Error} from "../Constants.sol";
import {IAttestator} from "../IAttestator.sol";

library SchemaLib {
    function addSchemaElement(
        bytes memory elementBytes,
        IAttestator.SchemaElement storage elementPointer
    ) internal returns (bytes32 elementHash) {
        (
            string memory name,
            string memory dataType,
            bytes[] memory childs
        ) = abi.decode(elementBytes, (string, string, bytes[]));

        require(bytes(name).length > 0, Error.ZERO_VALUE);

        bytes32[] memory childHashes = new bytes32[](childs.length);

        elementHash = keccak256(abi.encode(name, dataType));

        if (childs.length > 0) {
            require(
                bytes(dataType).length == 0,
                Error.DATA_TYPE_CHILDS_CONFLICT
            );

            for (uint i; i < childs.length; i++) {
                IAttestator.SchemaElement
                    storage childElementPointer = elementPointer.childs.push();

                childHashes[i] = addSchemaElement(
                    childs[i],
                    childElementPointer
                );
            }

            elementHash = keccak256(abi.encode(name, childHashes));
        }

        elementPointer.name = name;
        elementPointer.dataType = dataType;

        return elementHash;
    }

    function addSchema(
        IAttestator.SchemaElement[] storage schemaPointer,
        bytes[] memory schemaBytes
    ) internal returns (bytes32 schemaHash) {
        require(schemaBytes.length > 0, Error.ZERO_VALUE);

        bytes32[] memory elementHashes = new bytes32[](schemaBytes.length);

        for (uint i; i < schemaBytes.length; i++) {
            IAttestator.SchemaElement storage elementPointer = schemaPointer
                .push();

            elementHashes[i] = addSchemaElement(schemaBytes[i], elementPointer);
        }

        return keccak256(abi.encode(elementHashes));
    }

    function validateSchemaElement(
        IAttestator.SchemaElement memory schemaElement,
        bytes memory data,
        mapping(string => function(bytes memory) internal pure)
            storage decodeValidator
    ) internal view {
        if (schemaElement.childs.length == 0) {
            decodeValidator[schemaElement.dataType](data);
        } else {
            bytes[] memory decodedChilds = abi.decode(data, (bytes[]));

            require(
                schemaElement.childs.length == decodedChilds.length,
                Error.ARRAY_LENGTH
            );

            for (uint i = 0; i < schemaElement.childs.length; i++) {
                validateSchemaElement(
                    schemaElement.childs[i],
                    decodedChilds[i],
                    decodeValidator
                );
            }
        }
    }

    function validateSchema(
        IAttestator.SchemaElement[] memory schema,
        bytes memory data,
        mapping(string => function(bytes memory) internal pure)
            storage decodeValidator
    ) internal view {
        bytes[] memory decoded = abi.decode(data, (bytes[]));

        require(schema.length == decoded.length, Error.ARRAY_LENGTH);

        for (uint i; i < schema.length; i++) {
            validateSchemaElement(schema[i], decoded[i], decodeValidator);
        }
    }

    function encodeSchemaElement(
        IAttestator.SchemaElement storage schemaElementPointer
    ) internal view returns (bytes memory) {
        bytes[] memory childsEncoded = new bytes[](
            schemaElementPointer.childs.length
        );

        if (schemaElementPointer.childs.length > 0) {
            for (uint i; i < schemaElementPointer.childs.length; i++) {
                childsEncoded[i] = encodeSchemaElement(
                    schemaElementPointer.childs[i]
                );
            }
        }

        return
            abi.encode(
                schemaElementPointer.name,
                schemaElementPointer.dataType,
                childsEncoded
            );
    }

    function encodeSchema(
        IAttestator.SchemaElement[] storage schemaPointer
    ) internal view returns (bytes[] memory) {
        bytes[] memory schema = new bytes[](schemaPointer.length);

        for (uint i; i < schemaPointer.length; i++) {
            schema[i] = encodeSchemaElement(schemaPointer[i]);
        }

        return schema;
    }
}
