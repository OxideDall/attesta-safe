// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.18;

library DecodeValidator {
    function decodeNumeric(bytes memory data) internal pure {
        abi.decode(data, (uint));
    }

    function decodeNumericArray(bytes memory data) internal pure {
        abi.decode(data, (uint[]));
    }

    function decodeString(bytes memory data) internal pure {
        abi.decode(data, (string));
    }

    function decodeStringArray(bytes memory data) internal pure {
        abi.decode(data, (string[]));
    }

    function decodeBoolean(bytes memory data) internal pure {
        abi.decode(data, (bool));
    }

    function decodeBooleanArray(bytes memory data) internal pure {
        abi.decode(data, (bool[]));
    }

    function decodeBytes(bytes memory data) internal pure {
        abi.decode(data, (bytes));
    }

    function decodeBytesArray(bytes memory data) internal pure {
        abi.decode(data, (bytes[]));
    }

    function init(
        mapping(string => function(bytes memory) pure) storage decoders,
        mapping(string => bool) storage typeAllowed
    ) internal {
        decoders["int8"] = decodeNumeric;
        decoders["int16"] = decodeNumeric;
        decoders["int32"] = decodeNumeric;
        decoders["int64"] = decodeNumeric;
        decoders["int128"] = decodeNumeric;
        decoders["int256"] = decodeNumeric;
        decoders["uint8"] = decodeNumeric;
        decoders["uint16"] = decodeNumeric;
        decoders["uint32"] = decodeNumeric;
        decoders["uint64"] = decodeNumeric;
        decoders["uint128"] = decodeNumeric;
        decoders["uint256"] = decodeNumeric;
        decoders["int"] = decodeNumeric;
        decoders["uint"] = decodeNumeric;
        decoders["int[]"] = decodeNumericArray;
        decoders["int8[]"] = decodeNumericArray;
        decoders["int16[]"] = decodeNumericArray;
        decoders["int32[]"] = decodeNumericArray;
        decoders["int64[]"] = decodeNumericArray;
        decoders["int128[]"] = decodeNumericArray;
        decoders["int256[]"] = decodeNumericArray;
        decoders["uint[]"] = decodeNumericArray;
        decoders["uint8[]"] = decodeNumericArray;
        decoders["uint16[]"] = decodeNumericArray;
        decoders["uint32[]"] = decodeNumericArray;
        decoders["uint64[]"] = decodeNumericArray;
        decoders["uint128[]"] = decodeNumericArray;
        decoders["uint256[]"] = decodeNumericArray;
        decoders["string"] = decodeString;
        decoders["string[]"] = decodeStringArray;
        decoders["bool"] = decodeBoolean;
        decoders["bool[]"] = decodeBooleanArray;
        decoders["bytes"] = decodeBytes;
        decoders["bytes[]"] = decodeBytesArray;

        typeAllowed["int8"] = true;
        typeAllowed["int16"] = true;
        typeAllowed["int32"] = true;
        typeAllowed["int64"] = true;
        typeAllowed["int128"] = true;
        typeAllowed["int256"] = true;
        typeAllowed["uint8"] = true;
        typeAllowed["uint16"] = true;
        typeAllowed["uint32"] = true;
        typeAllowed["uint64"] = true;
        typeAllowed["uint128"] = true;
        typeAllowed["uint256"] = true;
        typeAllowed["int"] = true;
        typeAllowed["uint"] = true;
        typeAllowed["int[]"] = true;
        typeAllowed["uint[]"] = true;
        typeAllowed["string"] = true;
        typeAllowed["string[]"] = true;
        typeAllowed["bool"] = true;
        typeAllowed["bool[]"] = true;
        typeAllowed["bytes"] = true;
        typeAllowed["bytes[]"] = true;
        typeAllowed["int8[]"] = true;
        typeAllowed["int16[]"] = true;
        typeAllowed["int32[]"] = true;
        typeAllowed["int64[]"] = true;
        typeAllowed["int128[]"] = true;
        typeAllowed["int256[]"] = true;
        typeAllowed["uint8[]"] = true;
        typeAllowed["uint16[]"] = true;
        typeAllowed["uint32[]"] = true;
        typeAllowed["uint64[]"] = true;
        typeAllowed["uint128[]"] = true;
        typeAllowed["uint256[]"] = true;
    }
}
