import { HardhatEthersHelpers } from "hardhat/types";

type SchemaElementType<T> = { name: string; dataType: string; childs: T[] };
export interface SchemaElement extends SchemaElementType<SchemaElement> {}

export type Ethers = typeof import("ethers/lib/ethers") & HardhatEthersHelpers;

export type DynamicAttestationData = {
    name: string;
    typeName: string;
    data: any;
};

export type SynteticTypedData = {
    schema: { name: string; schema: SchemaElement[] };
    data: { body: { [key: string]: any }; expiriable: boolean };
};

export type SynteticTypedDataEncoded = {
    name: string;
    schema: SchemaElement[];
    schemaEncoded: string[];
    data: string;
    expiriable: boolean;
};
