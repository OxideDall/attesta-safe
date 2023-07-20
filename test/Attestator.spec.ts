import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Attestator } from "../typechain-types";
import {
    decodeSchema,
    deployed,
    encodeSchema,
    getACErrorText,
    getSchemaHash,
    decodeAttestationData,
    txWTimestamp,
    sleep,
    encodeAttestData
} from "../scripts/util";
import { Errors, Roles } from "../scripts/constants";
import { idSchema, idTestingData } from "../scripts/syntetic";
import { BigNumber, utils } from "ethers";
import {
    ParamType,
    arrayify,
    defaultAbiCoder,
    keccak256,
    solidityPack,
    toUtf8Bytes
} from "ethers/lib/utils";

describe("Attestator", () => {
    let owner: SignerWithAddress;
    let organisation: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;

    let attestator: Attestator;

    beforeEach(async () => {
        [owner, organisation, alice, bob] = await ethers.getSigners();

        attestator = await ethers
            .getContractFactory("Attestator")
            .then((f) => f.deploy(owner.address))
            .then(deployed);
    });

    it("Add organisation", async () => {
        const orgName = "ПАО «Зелёный Банк»";

        const add = await txWTimestamp(
            attestator.connect(organisation).addEntity(orgName),
            ethers
        );

        await expect(add.tx)
            .to.emit(attestator, "EntityAdded")
            .withArgs(organisation.address, orgName, add.timestamp);

        const name = await attestator.entityName(organisation.address);

        expect(name).eq(orgName);

        expect(await attestator.nameAllocated(name)).true;

        await expect(
            attestator.connect(organisation).addEntity("")
        ).to.be.revertedWith(Errors.ZERO_VALUE);

        await expect(attestator.addEntity(orgName)).to.be.revertedWith(
            Errors.ELEMENT_EXISTS
        );
    });

    it("Remove organisation", async () => {
        const orgName = "ПАО «Зелёный Банк»";

        await attestator.connect(organisation).addEntity(orgName);

        const remove = await txWTimestamp(
            attestator.connect(organisation).removeEntity(),
            ethers
        );

        await expect(remove.tx)
            .to.emit(attestator, "EntityRemoved")
            .withArgs(organisation.address, remove.timestamp);

        expect(await attestator.nameAllocated(orgName)).false;
        expect(await attestator.entityName(organisation.address)).eq("");
    });

    it("Add organisation schema", async () => {
        const orgName = "ПАО «Зелёный Банк»";

        const schemaName = "Данные пользователя";

        await attestator.connect(organisation).addEntity(orgName);

        const schemaBytes = encodeSchema(idSchema);

        const schemaHash = getSchemaHash(idSchema);

        const add = await txWTimestamp(
            attestator
                .connect(organisation)
                .addEntitySchema(schemaName, schemaBytes),
            ethers
        );

        await expect(add.tx)
            .to.emit(attestator, "EntitySchemaAdded")
            .withArgs(organisation.address, schemaHash, add.timestamp);

        expect(
            await attestator.attestorHasSchema(organisation.address, schemaHash)
        ).true;

        expect(
            await attestator.getEntitySchemaHashes(organisation.address)
        ).eqls([schemaHash]);

        const schemaObj = await attestator.getSchema(schemaHash);

        expect(decodeSchema(schemaObj[1])).to.deep.equal(idSchema);

        expect(schemaObj[0]).eq(schemaName);

        await expect(
            attestator.addEntitySchema("", schemaBytes)
        ).to.be.revertedWith(Errors.ENTITY_ACCESS);

        await expect(
            attestator.connect(organisation).addEntitySchema("", schemaBytes)
        ).to.be.revertedWith(Errors.ZERO_VALUE);

        await expect(
            attestator.connect(organisation).addEntitySchema("test", [])
        ).to.be.revertedWith(Errors.ZERO_VALUE);

        const conflictSchema = encodeSchema([
            {
                name: "root",
                dataType: "uint256",
                childs: [
                    {
                        name: "node",
                        dataType: "uint256",
                        childs: []
                    }
                ]
            }
        ]);

        await expect(
            attestator
                .connect(organisation)
                .addEntitySchema(schemaName, conflictSchema)
        ).to.be.revertedWith(Errors.DATA_TYPE_CHILDS_CONFLICT);
    });

    it("Remove organisation schema", async () => {
        const orgName = "ПАО «Зелёный Банк»";

        const schemaName = "Данные пользователя";

        await attestator.connect(organisation).addEntity(orgName);

        await attestator
            .connect(organisation)
            .addEntitySchema(schemaName, encodeSchema(idSchema));

        const schemaHash = getSchemaHash(idSchema);

        await expect(
            attestator.removeEntitySchema(schemaHash)
        ).to.be.revertedWith(Errors.NO_ELEMENT_IN_ARRAY);

        await expect(
            attestator.removeEntitySchema(
                BigNumber.from(ethers.utils.randomBytes(32))._hex
            )
        ).to.be.revertedWith(Errors.NO_ELEMENT_IN_ARRAY);

        const remove = await txWTimestamp(
            attestator.connect(organisation).removeEntitySchema(schemaHash),
            ethers
        );

        await expect(remove.tx)
            .to.emit(attestator, "EntitySchemaRemoved")
            .withArgs(organisation.address, schemaHash, remove.timestamp);

        expect(
            await attestator.attestorHasSchema(organisation.address, schemaHash)
        ).false;

        expect(
            await attestator.getEntitySchemaHashes(organisation.address)
        ).eqls([]);
    });

    it("Verify entity", async () => {
        const orgName = "ПАО «Зелёный Банк»";

        await attestator.connect(organisation).addEntity(orgName);

        await expect(
            attestator
                .connect(organisation)
                .verifyEntity(organisation.address, 1)
        ).to.be.revertedWith(
            getACErrorText(organisation.address, Roles.ATTESTATION_MANAGER)
        );

        await attestator.verifyEntity(organisation.address, 1);

        expect(
            await attestator.entityVerificationRank(organisation.address)
        ).eq(1);
    });

    describe("Attestation", async () => {
        it.only("Typed", async () => {
            const orgName = "ПАО «Зелёный Банк»";

            const schemaName = "Данные пользователя";

            const schemaHash = getSchemaHash(idSchema);

            await attestator.connect(organisation).addEntity(orgName);

            const currentTimestamp = await ethers.provider
                .getBlockNumber()
                .then((bn) => ethers.provider.getBlock(bn))
                .then((b) => b.timestamp);

            await expect(
                attestator
                    .connect(organisation)
                    .attestTyped(
                        organisation.address,
                        alice.address,
                        schemaHash,
                        "0x",
                        currentTimestamp + 1000,
                        "0x"
                    )
            ).to.be.revertedWith(Errors.ZERO_VALUE);

            await expect(
                attestator
                    .connect(organisation)
                    .attestTyped(
                        organisation.address,
                        alice.address,
                        schemaHash,
                        ethers.utils.randomBytes(32),
                        0,
                        "0x"
                    )
            ).to.be.revertedWith(Errors.ENTITY_SCHEMA_NOT_FOUND);

            await attestator
                .connect(organisation)
                .addEntitySchema(schemaName, encodeSchema(idSchema));

            await expect(
                attestator
                    .connect(organisation)
                    .attestTyped(
                        organisation.address,
                        alice.address,
                        schemaHash,
                        ethers.utils.randomBytes(32),
                        currentTimestamp - 1000,
                        "0x"
                    )
            ).to.be.revertedWith(Errors.ATTESTATION_INVALID_EXPIRATION);

            const dataEncoded = encodeAttestData(idTestingData, idSchema);

            await expect(
                attestator
                    .connect(alice)
                    .attestTyped(
                        organisation.address,
                        alice.address,
                        schemaHash,
                        dataEncoded,
                        0,
                        alice.signMessage(dataEncoded)
                    )
            ).to.be.revertedWith(Errors.ENTITY_INVALID_SIGNATURE);

            await expect(
                attestator
                    .connect(organisation)
                    .attestTyped(
                        organisation.address,
                        alice.address,
                        schemaHash,
                        ethers.utils.randomBytes(32),
                        0,
                        "0x"
                    )
            ).to.be.reverted;

            let attest = await txWTimestamp(
                attestator
                    .connect(organisation)
                    .attestTyped(
                        organisation.address,
                        alice.address,
                        schemaHash,
                        dataEncoded,
                        0,
                        "0x"
                    ),
                ethers
            );

            const packedSubject = defaultAbiCoder.encode(
                ["address"],
                [alice.address]
            );

            let dataHash = keccak256(
                solidityPack(
                    ["address", "uint256", "bytes"],
                    [packedSubject, 0, keccak256(dataEncoded)]
                )
            );

            await attest.tx;

            await expect(attest.tx)
                .to.emit(attestator, "TypedAttestation")
                .withArgs(
                    organisation.address,
                    alice.address,
                    schemaHash,
                    dataHash,
                    0,
                    attest.timestamp
                );

            let onchainAttestation = await attestator.getTypedAttestation(
                organisation.address,
                alice.address,
                schemaHash
            );

            expect(onchainAttestation.data).equal(dataEncoded);

            expect(
                decodeAttestationData(onchainAttestation.data, idSchema)
            ).to.deep.equal(idTestingData);

            const future = currentTimestamp + 10000;

            dataHash = keccak256(
                solidityPack(
                    ["address", "uint256", "bytes"],
                    [packedSubject, future, keccak256(dataEncoded)]
                )
            );

            attest = await txWTimestamp(
                attestator
                    .connect(alice)
                    .attestTyped(
                        organisation.address,
                        alice.address,
                        schemaHash,
                        dataEncoded,
                        future,
                        await organisation.signMessage(
                            ethers.utils.arrayify(dataHash)
                        )
                    ),
                ethers
            );

            await expect(attest.tx)
                .to.emit(attestator, "TypedAttestation")
                .withArgs(
                    organisation.address,
                    alice.address,
                    schemaHash,
                    dataHash,
                    future,
                    attest.timestamp
                );

            onchainAttestation = await attestator.getTypedAttestation(
                organisation.address,
                alice.address,
                schemaHash
            );

            expect(onchainAttestation.data).equal(dataEncoded);

            expect(
                decodeAttestationData(onchainAttestation.data, idSchema)
            ).to.deep.equal(idTestingData);

            expect(
                await attestator.getAttestorTypedUsers(organisation.address)
            ).eqls([alice.address]);

            expect(await attestator.getUserTypedAttestors(alice.address)).eqls([
                organisation.address
            ]);
        });

        it("Dynamic", async () => {
            await expect(
                attestator.connect(alice).attestDynamic(bob.address, "", [], 0)
            ).to.be.revertedWith(Errors.ZERO_VALUE);

            await expect(
                attestator
                    .connect(alice)
                    .attestDynamic(bob.address, "Отзыв", [], 0)
            ).to.be.revertedWith(Errors.ZERO_VALUE);

            const currentTimestamp = await ethers.provider
                .getBlockNumber()
                .then((bn) => ethers.provider.getBlock(bn))
                .then((b) => b.timestamp);

            await expect(
                attestator
                    .connect(alice)
                    .attestDynamic(
                        bob.address,
                        "Отзыв",
                        [{ data: "0x", typeName: "", name: "" }],
                        currentTimestamp - 1000
                    )
            ).to.be.revertedWith(Errors.ATTESTATION_INVALID_EXPIRATION);

            const emptyData = [
                { data: "0x", typeName: "uint256", name: "пусто" }
            ];

            await expect(
                attestator
                    .connect(alice)
                    .attestDynamic(
                        bob.address,
                        "Отзыв",
                        emptyData,
                        currentTimestamp + 1000
                    )
            ).to.be.revertedWith(Errors.ZERO_VALUE);

            const wrongType = [
                {
                    data: utils.defaultAbiCoder.encode(["uint256"], [666]),
                    typeName: "wrong32",
                    name: "ошибка"
                }
            ];

            await expect(
                attestator
                    .connect(alice)
                    .attestDynamic(
                        bob.address,
                        "Отзыв",
                        wrongType,
                        currentTimestamp + 1000
                    )
            ).to.be.revertedWith(Errors.DATA_TYPE_NOT_ALLOWED);

            const emptyName = [
                {
                    data: utils.defaultAbiCoder.encode(["uint256"], [42]),
                    typeName: "uint256",
                    name: ""
                }
            ];

            await expect(
                attestator
                    .connect(alice)
                    .attestDynamic(
                        bob.address,
                        "Отзыв",
                        emptyName,
                        currentTimestamp + 1000
                    )
            ).to.be.revertedWith(Errors.ZERO_VALUE);

            const correctData = [
                {
                    data: utils.defaultAbiCoder.encode(["uint8"], [42]),
                    typeName: "uint8",
                    name: "Рейтинг"
                },
                {
                    data: utils.defaultAbiCoder.encode(
                        ["string"],
                        ["Добросовестный пользователь"]
                    ),
                    typeName: "string",
                    name: "Комментарий"
                }
            ];

            const dataHash = keccak256(
                utils.defaultAbiCoder.encode(
                    [
                        ParamType.fromObject({
                            name: "data",
                            type: "tuple[]",
                            components: [
                                {
                                    name: "data",
                                    type: "bytes"
                                },
                                {
                                    name: "typeName",
                                    type: "string"
                                },
                                {
                                    name: "name",
                                    type: "string"
                                }
                            ]
                        })
                    ],
                    [correctData]
                )
            );

            const attest = await txWTimestamp(
                attestator
                    .connect(alice)
                    .attestDynamic(bob.address, "Отзыв", correctData, 0),
                ethers
            );

            await expect(attest.tx)
                .to.emit(attestator, "DynamicAttestation")
                .withArgs(
                    alice.address,
                    bob.address,
                    "Отзыв",
                    dataHash,
                    0,
                    attest.timestamp
                );

            const onchain = await attestator.getDynamicAttestation(
                alice.address,
                bob.address,
                "Отзыв"
            );

            expect(onchain.data).eqls(correctData.map((d) => Object.values(d)));
            expect(onchain.expiredAt).equal(0);

            expect(
                await attestator.getAttestorDynamicUsers(alice.address)
            ).eqls([bob.address]);

            expect(
                await attestator.getAttestorToUserClaims(
                    alice.address,
                    bob.address
                )
            ).eqls(["Отзыв"]);
        });
    });

    describe("Revoke attestation", async () => {
        it("Typed", async () => {
            const orgName = "ПАО «Зелёный Банк»";

            const schemaName = "Данные пользователя";

            const schemaHash = getSchemaHash(idSchema);

            await attestator.connect(organisation).addEntity(orgName);

            await attestator
                .connect(organisation)
                .addEntitySchema(schemaName, encodeSchema(idSchema));

            const dataEncoded = encodeAttestData(idTestingData, idSchema);

            await expect(
                attestator.revokeTyped(bob.address, schemaHash)
            ).to.be.revertedWith(Errors.ZERO_VALUE);

            const currentTimestamp = await ethers.provider
                .getBlockNumber()
                .then((bn) => ethers.provider.getBlock(bn))
                .then((b) => b.timestamp);

            await attestator
                .connect(organisation)
                .attestTyped(
                    organisation.address,
                    alice.address,
                    schemaHash,
                    dataEncoded,
                    currentTimestamp + 100,
                    "0x"
                );

            const revoke = await txWTimestamp(
                attestator
                    .connect(organisation)
                    .revokeTyped(alice.address, schemaHash),
                ethers
            );

            await expect(revoke.tx)
                .to.emit(attestator, "TypedAttestationRevoked")
                .withArgs(
                    organisation.address,
                    alice.address,
                    schemaHash,
                    revoke.timestamp
                );

            expect(
                await attestator.getTypedAttestation(
                    organisation.address,
                    alice.address,
                    schemaHash
                )
            ).eqls(["0x", BigNumber.from(0)]);

            expect(
                await attestator.getAttestorTypedUsers(organisation.address)
            ).eqls([]);
            expect(await attestator.getUserTypedAttestors(alice.address)).eqls(
                []
            );
            expect(
                await attestator.getAttestorToUserClaims(
                    organisation.address,
                    alice.address
                )
            ).eqls([]);
        });

        it("Dynamic", async () => {
            const correctData = [
                {
                    data: utils.defaultAbiCoder.encode(["uint8"], [42]),
                    typeName: "uint8",
                    name: "Рейтинг"
                },
                {
                    data: utils.defaultAbiCoder.encode(
                        ["string"],
                        ["Добросовестный пользователь"]
                    ),
                    typeName: "string",
                    name: "Комментарий"
                }
            ];

            const currentTimestamp = await ethers.provider
                .getBlockNumber()
                .then((bn) => ethers.provider.getBlock(bn))
                .then((b) => b.timestamp);

            await attestator
                .connect(alice)
                .attestDynamic(
                    bob.address,
                    "Отзыв",
                    correctData,
                    currentTimestamp + 100
                );

            await expect(
                attestator.revokeDynamic(bob.address, "Отзыв")
            ).to.be.revertedWith(Errors.ZERO_VALUE);

            await expect(
                attestator.connect(alice).revokeDynamic(alice.address, "Отзыв")
            ).to.be.revertedWith(Errors.ZERO_VALUE);

            await sleep(80, ethers);

            await expect(
                attestator.connect(alice).revokeDynamic(bob.address, "")
            ).to.be.revertedWith(Errors.ZERO_VALUE);

            await sleep(30, ethers);
            const revoke = await txWTimestamp(
                attestator.connect(alice).revokeDynamic(bob.address, "Отзыв"),
                ethers
            );

            await expect(revoke.tx)
                .to.emit(attestator, "DynamicAttestationRevoked")
                .withArgs(
                    alice.address,
                    bob.address,
                    "Отзыв",
                    revoke.timestamp
                );

            const onchain = await attestator.getDynamicAttestation(
                alice.address,
                bob.address,
                "Отзыв"
            );

            expect(onchain.data).eqls([]);

            expect(
                await attestator.getAttestorDynamicUsers(alice.address)
            ).eqls([]);

            expect(
                await attestator.getAttestorToUserClaims(
                    alice.address,
                    bob.address
                )
            ).eqls([]);
        });
    });
});
