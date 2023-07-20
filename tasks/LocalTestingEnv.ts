import {
    TASK_NODE_CREATE_SERVER,
    TASK_NODE_GET_PROVIDER
} from "hardhat/builtin-tasks/task-names";
import { task } from "hardhat/config";
import { entropyToMnemonic, parseEther, toUtf8Bytes } from "ethers/lib/utils";
import { deployed, getSchemaHash } from "../scripts/util";
import {
    getSynteticDynamicData,
    getSynteticTypedData
} from "../scripts/syntetic";

import { wordlists } from "ethers";

const MNEMONIC_SEED = process.env.USERS_MNEMONIC_ENTROPY as string;

const HARDHAT_NETWORK_MNEMONIC = entropyToMnemonic(
    toUtf8Bytes(MNEMONIC_SEED),
    wordlists.en
);

const HOSTNAME = "0.0.0.0";
const PORT = 8545;

task("local", "Creates local testing environment").setAction(async (_, hre) => {
    await hre.run("compile");

    const hreProvider = await hre.run(TASK_NODE_GET_PROVIDER);

    const server = await hre.run(TASK_NODE_CREATE_SERVER, {
        hostname: HOSTNAME,
        port: PORT,
        provider: hreProvider
    });

    await hreProvider.request({
        method: "hardhat_setLoggingEnabled",
        params: [false]
    });

    await server.listen();

    const wallets = [];

    for (let i = 0; i < 10; i++) {
        wallets.push(
            hre.ethers.Wallet.fromMnemonic(
                HARDHAT_NETWORK_MNEMONIC,
                `m/44'/60'/0'/0/${i}`
            )
        );

        await hre.ethers.provider.send("hardhat_setBalance", [
            wallets[i].address,
            parseEther("1000000")._hex
        ]);
    }

    const accounts = wallets.map((w) => w.connect(hre.ethers.provider));

    const [deployer, manager, goverment, organisation, community, ...users] =
        accounts;

    const entityProperties = {
        [goverment.address]: {
            name: "Министерство цепочных технологий",
            signer: goverment,
            verification: 2
        },
        [organisation.address]: {
            name: "ООО «Круговая порука»",
            signer: organisation,
            verification: 1
        },
        [community.address]: {
            name: "Сообщество «Шифроцепь»",
            signer: community,
            verification: 0
        }
    };

    const attestator = await hre.ethers
        .getContractFactory("Attestator", deployer)
        .then((f) => f.deploy(manager.address))
        .then(deployed);
    console.log("Attestator deployed.");

    const synteticTypedData = getSynteticTypedData(
        goverment.address,
        organisation.address,
        community.address
    );

    const now = await hre.ethers.provider
        .getBlockNumber()
        .then((b) => hre.ethers.provider.getBlock(b))
        .then((b) => b.timestamp);

    for (const entity of Object.keys(synteticTypedData)) {
        const entityAttributes = entityProperties[entity];

        const signedAttestator = attestator.connect(entityAttributes.signer);

        await signedAttestator.addEntity(entityAttributes.name);

        await attestator
            .connect(manager)
            .verifyEntity(entity, entityAttributes.verification);

        const entityTypedData = synteticTypedData[entity];

        for (let i = 0; i < entityTypedData.length; i++) {
            await signedAttestator
                .addEntitySchema(
                    entityTypedData[i].name,
                    entityTypedData[i].schemaEncoded
                )
                .then((tx) => tx.wait())
                .then(() =>
                    signedAttestator.attestTyped(
                        entity,
                        users[i].address,
                        getSchemaHash(entityTypedData[i].schema),
                        entityTypedData[i].data,
                        entityTypedData[i].expiriable ? now + 1000 : 0,
                        "0x"
                    )
                )
                .then(() =>
                    signedAttestator.attestTyped(
                        entity,
                        users[i + 1].address,
                        getSchemaHash(entityTypedData[i].schema),
                        entityTypedData[i].data,
                        entityTypedData[i].expiriable ? now + 2000 : 0,
                        "0x"
                    )
                );
        }
    }

    console.log("Syntetic typed data attested.");

    for (const dynamicData of getSynteticDynamicData()) {
        await Promise.all(
            users.map(async (usr) => {
                for (const usrTo of users) {
                    await attestator
                        .connect(usr)
                        .attestDynamic(
                            usrTo.address,
                            dynamicData.key,
                            dynamicData.body,
                            dynamicData.expiriable ? now + 1000 : 0
                        );
                }
            })
        );
    }

    console.log("Syntetic dynamic data attested.");
    console.log("Protocol deployed and configured.");

    console.log("Attestator address:", attestator.address);
    console.log(
        `Deployer: [KEY: ${deployer.privateKey}] [ADDRESS: ${deployer.address}]`
    );
    console.log(
        `Goverment: [KEY: ${goverment.privateKey}] [ADDRESS: ${goverment.address}]`
    );
    console.log(
        `Organisation: [KEY: ${organisation.privateKey}] [ADDRESS: ${organisation.address}]`
    );
    console.log(
        `Community: [KEY: ${community.privateKey}] [ADDRESS: ${community.address}]`
    );

    console.log(
        "Users:",
        users.map((u) => `[KEY: ${u.privateKey}] [ADDRESS: ${u.address}]`)
    );

    console.log(`Server is listening on ${HOSTNAME}:${PORT}`);

    await server.waitUntilClosed();
});
