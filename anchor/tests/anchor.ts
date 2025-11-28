import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Anchor } from "../target/types/anchor";
import { PublicKey } from "@solana/web3.js";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { expect } from "chai";

const IDL = require("../target/idl/anchor.json");

const votingAddress = new PublicKey("FyUxZy67eUenJwRsucA7iJozGLSFJf3xzq5hR6SXrtUv")

describe("Anchor", () => {
  let context;
  let provider;
  let votingProgram;

  before( async () =>  {
     context = await startAnchor("", [{ name: "anchor", programId: votingAddress }], []);
     provider = new BankrunProvider(context);

     votingProgram = new Program<Anchor>(IDL, provider);
  })

  it("Initialize Poll!", async () => {
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

  it("Initialize Candidate!", async () => {
    await votingProgram.methods.initializeCandidate(
      "Rust",
      new anchor.BN(1)
    ).rpc();
    await votingProgram.methods.initializeCandidate(
      "TypeScript",
      new anchor.BN(1)
    ).rpc();

    const [rustCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8),Buffer.from("Rust")],
      votingAddress
    )

    const rustCandidate = await votingProgram.account.candidate.fetch(rustCandidateAddress)

    console.log("Rust Candidate:", rustCandidate);

    expect(rustCandidate.candidateVotes.toNumber()).to.equal(0);

    const [typeScriptCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("TypeScript")],
      votingAddress
    )
    const typeScriptCandidate = await votingProgram.account.candidate.fetch(typeScriptCandidateAddress);

    console.log("TypeScript Candidate:", typeScriptCandidate);

    expect(typeScriptCandidate.candidateVotes.toNumber()).to.equal(0);
  });

  it("Vote for Candidate!", async () => {
    await votingProgram.methods.vote(
      "Rust",
      new anchor.BN(1),
    ).rpc();

    const [rustCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Rust")],
      votingAddress
    )

    const rustCandidate = await votingProgram.account.candidate.fetch(rustCandidateAddress);

    console.log("Rust Candidate:", rustCandidate);

    expect(rustCandidate.candidateVotes.toNumber()).to.equal(1);
  })
});
