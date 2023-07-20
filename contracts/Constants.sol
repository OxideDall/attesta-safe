// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.18;

library Error {
    string public constant ZERO_VALUE = "0";
    string public constant ELEMENT_EXISTS = "1";
    string public constant NOT_EXISTS = "2";
    string public constant ARRAY_LENGTH = "3";
    string public constant DATA_TYPE_NOT_ALLOWED = "4";
    string public constant NO_ELEMENT_IN_ARRAY = "5"; //  there is no element in array
    string public constant ELEMENT_IN_ARRAY = "6"; //  there is already element in array

    string public constant ATTESTATION_INVALID_EXPIRATION = "10";
    string public constant DATA_TYPE_CHILDS_CONFLICT = "11";
    string public constant SCHEMA_IN_USE = "12";

    string public constant ENTITY_ACCESS = "20";
    string public constant ENTITY_SCHEMA_ACCESS = "21";
    string public constant ENTITY_SCHEMA_NOT_FOUND = "22";
    string public constant ENTITY_INVALID_SIGNATURE = "23";
}

library Roles {
    bytes32 public constant ATTESTATION_MANAGER =
        bytes32(
            0xa7e57a7040000000000000000000000000000000000000000000000000000000
        );
}
