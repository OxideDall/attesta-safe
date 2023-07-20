import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-solhint";
import * as dotenv from "dotenv";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

import "./tasks/LocalTestingEnv";

const config: HardhatUserConfig = {
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: false,
        runOnCompile: false,
        strict: true
    },
    abiExporter: {
        path: "./abi",
        runOnCompile: true,
        clear: true,
        spacing: 2,
        only: [
            /**
             * List of specific contract names for exporting ABI
             */
            // ":ERC20",
        ],
        format: "json"
    },
    networks: {
        siberium: {
            url: process.env.SIBERIUM_URL || "",
            chainId: 111000
        }
    },
    etherscan: {
        customChains: [
            {
                network: "siberium",
                chainId: 111000,
                urls: {
                    apiURL: "https://siberium.net/api",
                    browserURL: "https://siberium.net/"
                }
            }
        ],
        apiKey: {
            siberium: "test"
        }
    },
    solidity: {
        compilers: [
            {
                version: "0.8.18",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 10
                    }
                }
            }
        ]
    }
};

export default config;
