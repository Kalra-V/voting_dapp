import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Anchor } from "../target/types/anchor";
import { PublicKey } from "@solana/web3.js";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { expect } from "chai";

const IDL = require("../target/idl/anchor.json");

const votingAddress = new PublicKey("FyUxZy67eUenJwRsucA7iJozGLSFJf3xzq5hR6SXrtUv")

describe("Anchor", () => {
  it("Initialize Poll!", async () => {
    const context = await startAnchor("", [{ name: "anchor", programId: votingAddress }], []);
    const provider = new BankrunProvider(context);

    const votingProgram = new Program<Anchor>(IDL, provider);

    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      new anchor.BN(0),
      new anchor.BN(1864244339),
      "Which is your favorite programming language?"
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log("Poll:", poll);

    expect(poll.pollId.toNumber()).to.equal(1);
    expect(poll.description).to.equal("Which is your favorite programming language?");
    expect(poll.pollStart.toNumber()).to.be.lessThan(poll.pollEnd.toNumber());

    console.log("Poll initialized!");
  });
});
