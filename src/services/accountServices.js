import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import Wallet from '@project-serum/sol-wallet-adapter';

const connection = new Connection('http://localhost:8899');

export async function createOrGetAccount(seed, programId) {
  let providerUrl = 'https://www.soillet.io';
  let wallet = new Wallet(providerUrl);

  await wallet.connect();

  const derivedAddress = await PublicKey.createWithSeed(
    wallet.publicKey,
    seed,
    programId
  );

  const mailAccount = await connection.getAccountInfo(derivedAddress);

  if (mailAccount === null) {
    const lamports = await connection.getMinimumBalanceForRentExemption(
      1000000
    );

    const createAccountInstruction = SystemProgram.createAccountWithSeed({
      fromPubkey: wallet.publicKey,
      basePubkey: wallet.publicKey,
      seed,
      newAccountPubKey: derivedAddress,
      lamports,
      space: 1000000,
      programId: programId,
    });

    const initAccountInstruction = new TransactionInstruction({
      keys: [{ pubkey: derivedAddress, isSigner: false, isWritable: true }],
      programId,
      data: Buffer.from([0]),
    });

    const transaction = new Transaction();
    transaction.add(createAccountInstruction).add(initAccountInstruction);

    let { blockhash } = await connection.getLatestBlockhash();
    // TODO: check wether recentBloackhash works or not.
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    let signed = await wallet.signTransaction(transaction);
    let txid = await connection.sendRawTransaction(signed.serialize());

    // TODO: check for replacement of confirmTransaction by @deprecated — Instead, call confirmTransaction and pass in TransactionConfirmationStrategy
    await connection.confirmTransaction(txid);
  }

  return {
    derivedAddress,
    wallet,
  };
}
