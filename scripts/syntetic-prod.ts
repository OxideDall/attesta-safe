import {
    TASK_NODE_CREATE_SERVER,
    TASK_NODE_GET_PROVIDER
} from "hardhat/builtin-tasks/task-names";
import { task } from "hardhat/config";
import {
    arrayify,
    defaultAbiCoder,
    entropyToMnemonic,
    keccak256,
    parseEther,
    solidityPack,
    toUtf8Bytes,
    toUtf8String
} from "ethers/lib/utils";
import { deployed, getSchemaHash } from "../scripts/util";
import {
    getSynteticDynamicData,
    getSynteticTypedData,
    idSchema
} from "../scripts/syntetic";

import { encodeAttestData } from "../scripts/util";
import { wordlists } from "ethers";
import { ethers } from "hardhat";
const MNEMONIC_SEED = process.env.USERS_MNEMONIC_ENTROPY as string;

const HARDHAT_NETWORK_MNEMONIC = entropyToMnemonic(
    toUtf8Bytes(MNEMONIC_SEED),
    wordlists.en
);

async function main() {
    const wallets = [];

    for (let i = 0; i < 10; i++) {
        wallets.push(
            ethers.Wallet.fromMnemonic(
                HARDHAT_NETWORK_MNEMONIC,
                `m/44'/60'/0'/0/${i}`
            )
        );
    }

    const accounts = wallets.map((w) => w.connect(ethers.provider));

    const manager = new ethers.Wallet(process.env.ADMIN_KEY as string).connect(
        ethers.provider
    );

    const [, , goverment, organisation, community, ...users] = accounts;

    const entityProperties = {
        [goverment.address]: {
            name: "Министерство цифровых технологий",
            signer: goverment,
            verification: 2
        },
        [organisation.address]: {
            name: "ПАО «Зеленый Банк»",
            signer: organisation,
            verification: 1
        },
        [community.address]: {
            name: "Сообщество «Шифроцепь»",
            signer: community,
            verification: 0
        }
    };

    const attestator = await ethers.getContractAt(
        "Attestator",
        "0xae7337bD18921781D56676E42608fF2a05cFff7e"
    );

    const synteticTypedData = getSynteticTypedData(
        goverment.address,
        organisation.address,
        community.address
    );

    const now = await ethers.provider
        .getBlockNumber()
        .then((b) => ethers.provider.getBlock(b))
        .then((b) => b.timestamp);

    for (const entity of Object.keys(synteticTypedData)) {
        const entityAttributes = entityProperties[entity];

        const signedAttestator = attestator.connect(entityAttributes.signer);

        console.log(`Adding entity: ${entityAttributes.name}`);

        await signedAttestator
            .addEntity(entityAttributes.name)
            .then((tx) => tx.wait());

        console.log("Entity verification..");
        await attestator
            .connect(manager)
            .verifyEntity(entity, entityAttributes.verification)
            .then((tx) => tx.wait());

        const entityTypedData = synteticTypedData[entity];

        for (let i = 0; i < entityTypedData.length; i++) {
            console.log("Adding schema.");
            await signedAttestator
                .addEntitySchema(
                    entityTypedData[i].name,
                    entityTypedData[i].schemaEncoded
                )
                .then((tx) => tx.wait());

            console.log("Attest typed 1");

            await signedAttestator
                .attestTyped(
                    entity,
                    users[i].address,
                    getSchemaHash(entityTypedData[i].schema),
                    entityTypedData[i].data,
                    entityTypedData[i].expiriable ? now + 100000000 : 0,
                    "0x"
                )
                .then((tx) => tx.wait());

            console.log("Attest typed 2");

            await signedAttestator
                .attestTyped(
                    entity,
                    users[i + 1].address,
                    getSchemaHash(entityTypedData[i].schema),
                    entityTypedData[i].data,
                    entityTypedData[i].expiriable ? now + 200000000 : 0,
                    "0x"
                )
                .then((tx) => tx.wait(2));
        }
    }

    console.log("Syntetic typed data attested.");

    let counter = 0;
    for (const dynamicData of getSynteticDynamicData()) {
        for (const usr of users) {
            for (const usrTo of users) {
                console.log("Attest typed data");
                if (counter > 64) {
                    await attestator
                        .connect(usr)
                        .attestDynamic(
                            usrTo.address,
                            dynamicData.key,
                            dynamicData.body,
                            dynamicData.expiriable ? now + 1000 : 0
                        )
                        .then((tx) => tx.wait());
                }
                counter++;
            }
        }
    }

    console.log("Syntetic dynamic data attested.");
    console.log("Protocol deployed and configured.");
}

main();
