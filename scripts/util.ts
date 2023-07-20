/**
 * Write common shared utility function in this module.
 * Such functionality may be reused for scripts and tests.
 */
import { Contract, ContractTransaction, Wallet } from "ethers";
import { IAttestator } from "../typechain-types";
import { DynamicAttestationData, Ethers, SchemaElement } from "./types";
import { defaultAbiCoder, keccak256 } from "ethers/lib/utils";

export const deployed = <T extends Contract>(c: T) =>
    c.deployed() as Promise<T>;

export const sleep = (s: number, e: Ethers) =>
    e.provider
        .send("evm_increaseTime", [s])
        .then(() => e.provider.send("evm_mine", []));

export const getRandomAddress = () => Wallet.createRandom().address;

export const txWTimestamp = async (
    tx: Promise<ContractTransaction>,
    e: Ethers
) => {
    const timestamp = await tx
        .then((t) => e.provider.getBlock(t.blockNumber as unknown as number))
        .then((b) => b.timestamp);
    return { tx: Promise.resolve(tx), timestamp };
};
export const getACErrorText = (address: string, role: string) =>
    `AccessControl: account ${address.toLowerCase()} is missing role ${role}`;

const encodeSchemaElement = (el: SchemaElement) => {
    const encodedElements: string[] = [];

    if (el.childs.length > 0) {
        for (const child of el.childs) {
            encodedElements.push(encodeSchemaElement(child));
        }
    }

    return defaultAbiCoder.encode(
        ["string", "string", "bytes[]"],
        [el.name, el.dataType, encodedElements]
    );
};

export const encodeSchema = (schema: SchemaElement[]) =>
    schema.map((el) => encodeSchemaElement(el));

const decodeSchemaElement = (elementBytes: string) => {
    const decoded = defaultAbiCoder.decode(
        ["string", "string", "bytes[]"],
        elementBytes
    );

    const childs: SchemaElement[] = [];

    if (decoded[2].length > 0) {
        for (const childBytes of decoded[2]) {
            childs.push(decodeSchemaElement(childBytes));
        }
    }

    return { name: decoded[0], dataType: decoded[1], childs: childs };
};

export const decodeSchema = (schemaBytes: string[]) =>
    schemaBytes.map((el) => decodeSchemaElement(el));

const getSchemaElementHash = (el: SchemaElement) => {
    const childHashes: string[] = [];

    let elementHash = keccak256(
        defaultAbiCoder.encode(["string", "string"], [el.name, el.dataType])
    );
    if (el.childs.length > 0) {
        for (const child of el.childs) {
            childHashes.push(getSchemaElementHash(child));
        }

        elementHash = keccak256(
            defaultAbiCoder.encode(
                ["string", "bytes32[]"],
                [el.name, childHashes]
            )
        );
    }

    return elementHash;
};

export const getSchemaHash = (schema: SchemaElement[]) =>
    keccak256(
        defaultAbiCoder.encode(
            ["bytes32[]"],
            [schema.map((el) => getSchemaElementHash(el))]
        )
    );

const encodeAttestDataElement = (
    data: any,
    elementSchema: SchemaElement
): string => {
    if (elementSchema.childs.length == 0) {
        return defaultAbiCoder.encode([elementSchema.dataType], [data]);
    }

    return defaultAbiCoder.encode(
        ["bytes[]"],
        [
            elementSchema.childs.map((el) => {
                return encodeAttestDataElement(data[el.name], el);
            })
        ]
    );
};

export const encodeAttestData = (
    data: { [key: string]: any },
    schema: SchemaElement[]
) =>
    defaultAbiCoder.encode(
        ["bytes[]"],
        [schema.map((el) => encodeAttestDataElement(data[el.name], el))]
    );

const decodeAttestationDataElement = (
    elementData: string,
    elementSchema: SchemaElement
): { [key: string]: any } => {
    if (elementSchema.childs.length == 0) {
        return defaultAbiCoder.decode([elementSchema.dataType], elementData)[0];
    }

    return (
        defaultAbiCoder.decode(["bytes[]"], elementData)[0] as string[]
    ).reduce(
        (res, elementBytes, i) => ({
            ...res,
            [elementSchema.childs[i].name]: decodeAttestationDataElement(
                elementBytes,
                elementSchema.childs[i]
            )
        }),
        {} as { [key: string]: any }
    );
};

export const decodeAttestationData = (
    attestationData: string,
    schema: SchemaElement[]
): { [key: string]: any } =>
    (
        defaultAbiCoder.decode(["bytes[]"], attestationData)[0] as string[]
    ).reduce(
        (res, elementBytes, i) => ({
            ...res,
            [schema[i].name]: decodeAttestationDataElement(
                elementBytes,
                schema[i]
            )
        }),
        {} as { [key: string]: any }
    );

export const decodeDynamicAttestationData = (
    data: IAttestator.DynamicDataStructOutput[]
): DynamicAttestationData[] =>
    data.map((d) => ({
        name: d.name,
        typeName: d.typeName,
        data: defaultAbiCoder.decode([d.typeName], d.data)[0]
    }));
