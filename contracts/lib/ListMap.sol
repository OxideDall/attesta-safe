// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.18;

import {Error} from "./../Constants.sol";

/*
 * @title ListMap
 * @notice Library for combining lists and mapping
 * @notice Allows to manage easily collections and avoid iterations
 */
library ListMap {
    struct _address {
        address[] list;
        mapping(address => bool) includes;
    }

    struct _bytes32 {
        bytes32[] list;
        mapping(bytes32 => bool) includes;
    }

    /**
     * @dev remove list
     * @param listMap listMap which should be changed
     * @param list list of items to remove from listMap
     */
    function removeList(
        _address storage listMap,
        address[] memory list
    ) internal {
        for (uint256 i; i < list.length; i++) {
            remove(listMap, list[i]);
        }
    }

    /**
     * @dev remove list
     * @param listMap listMap which should be changed
     * @param list list of items to remove from listMap
     */
    function removeList(
        _bytes32 storage listMap,
        bytes32[] memory list
    ) internal {
        for (uint256 i; i < list.length; i++) {
            remove(listMap, list[i]);
        }
    }

    /**
     * @dev remove item
     * @param listMap listMap which should be changed
     * @param value item to remove from listMap
     */
    function remove(_address storage listMap, address value) internal {
        for (uint256 i; i < listMap.list.length; i++) {
            if (listMap.list[i] == value) {
                listMap.list[i] = listMap.list[listMap.list.length - 1];
                listMap.list.pop();
                listMap.includes[value] = false;
                return;
            }
        }
        revert(Error.NO_ELEMENT_IN_ARRAY);
    }

    /**
     * @dev remove item
     * @param listMap listMap which should be changed
     * @param value item to remove from listMap
     */
    function remove(_bytes32 storage listMap, bytes32 value) internal {
        for (uint256 i; i < listMap.list.length; i++) {
            if (listMap.list[i] == value) {
                listMap.list[i] = listMap.list[listMap.list.length - 1];
                listMap.list.pop();
                listMap.includes[value] = false;
                return;
            }
        }
        revert(Error.NO_ELEMENT_IN_ARRAY);
    }

    /**
     * @dev add list
     * @param listMap listMap which should be changed
     * @param list list of items to add to listMap
     */
    function addList(_address storage listMap, address[] memory list) internal {
        for (uint256 i; i < list.length; i++) {
            add(listMap, list[i]);
        }
    }

    /**
     * @dev add list
     * @param listMap listMap which should be changed
     * @param list list of items to add to listMap
     */
    function addList(_bytes32 storage listMap, bytes32[] memory list) internal {
        for (uint256 i; i < list.length; i++) {
            add(listMap, list[i]);
        }
    }

    /**
     * @dev add item
     * @param listMap listMap which should be changed
     * @param value item to add to listMap
     */
    function add(_address storage listMap, address value) internal {
        if (listMap.includes[value]) return;
        listMap.includes[value] = true;
        listMap.list.push(value);
    }

    /**
     * @dev add item
     * @param listMap listMap which should be changed
     * @param value item to add to listMap
     */
    function add(_bytes32 storage listMap, bytes32 value) internal {
        require(!listMap.includes[value], Error.ELEMENT_IN_ARRAY);
        listMap.includes[value] = true;
        listMap.list.push(value);
    }

    /**
     * @dev Check that listMap contains all values from list
     * @param listMap listMap to check
     * @param values values which should be present
     */
    function includesAll(
        _address storage listMap,
        address[] memory values
    ) internal view {
        for (uint256 i; i < values.length; i++) {
            require(listMap.includes[values[i]], Error.ELEMENT_IN_ARRAY);
        }
    }

    /**
     * @dev Check that listMap contains all values from list
     * @param listMap listMap to check
     * @param values values which should be present
     */
    function includesAll(
        _bytes32 storage listMap,
        bytes32[] memory values
    ) internal view {
        for (uint256 i; i < values.length; i++) {
            require(listMap.includes[values[i]], Error.ELEMENT_IN_ARRAY);
        }
    }
}
