import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from '@solana/actions'
import { Program, BN } from '@coral-xyz/anchor'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Anchor } from '../../../../anchor/target/types/anchor'

const IDL = require('../../../../anchor/target/idl/anchor.json')

export const OPTIONS = GET

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: 'http://rust-lang.org/logos/rust-logo-512x512-blk.png',
    title: 'Vote for your favorite programming language',
    description: 'Vote between Rust and TypeScript',
    label: 'Vote',
    links: {
      actions: [
        {
          label: 'Vote for Rust',
          href: '/api/vote?candidate=Rust',
          type: 'transaction',
        },
        {
          label: 'Vote for TypeScript',
          href: '/api/vote?candidate=Typescript',
          type: 'transaction',
        },
      ],
    },
  }
  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS })
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const candidate = url.searchParams.get('candidate')

  if (candidate != 'Rust' && candidate != 'Typescript') {
    return Response.json({ error: 'Invalid candidate' }, { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const connection = new Connection('http://127.0.0.1:8899', { commitment: 'confirmed' })

  const program: Program<Anchor> = new Program(IDL, { connection })

  const body: ActionPostRequest = await request.json()
  let voter

  try {
    voter = new PublicKey(body.account)
  } catch (error) {
    return Response.json({ error: 'Invalid account' }, { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const instruction = await program.methods.vote(candidate, new BN(1)).accounts({ signer: voter }).instruction()

  const blockhash = await connection.getLatestBlockhash()

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(instruction)

  const response = await createPostResponse({
    fields: {
      transaction: transaction,
      type: 'transaction',
    },
  })

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS })
}
