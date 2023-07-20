import { Wallet } from "ethers";
import { ethers } from "hardhat";

async function main() {
    const admin = new Wallet(process.env.ADMIN_KEY as string, ethers.provider);

    const f = await ethers.getContractFactory("Attestator", admin);

    const c = await f.deploy(admin.address);

    await c.deployed();

    console.log(c.address);
}

main();
