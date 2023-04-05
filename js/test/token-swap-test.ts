import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

const TOKEN_SWAP_PROGRAM_ID = new PublicKey(
  '3LB4DBcbCtMjJn2geDBzGidbpEgG9Z4785tRSAfNeedP',
);
import {AccountLayout, Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';

import {TokenSwap, CurveType} from '../src';
import {newAccountWithLamports} from '../src/util/new-account-with-lamports';
import {sleep} from '../src/util/sleep';
import {Numberu64} from '../src';
import {publicKey} from '../src/layout';
const fs = require('fs');

// The following globals are created by `createTokenSwap` and used by subsequent tests
// Token swap
let tokenSwap: TokenSwap;
// authority of the token and accounts
let authority: PublicKey;
// bump seed used to generate the authority public key
let bumpSeed: number;
// owner of the user accounts
let owner: Account;
// Token pool
let tokenPool:PublicKey;
let tokenAccountPool: PublicKey;
let feeAccount: PublicKey;
// Tokens swapped
let mintA:PublicKey;// Token;
let mintB :PublicKey;//: Token;
let tokenAccountA: PublicKey;
let tokenAccountB: PublicKey;
let userAccountA: PublicKey;
let userAccountB: PublicKey;
// Hard-coded fee address, for testing production mode
const SWAP_PROGRAM_OWNER_FEE_ADDRESS =
  process.env.SWAP_PROGRAM_OWNER_FEE_ADDRESS;

// Pool fees
const TRADING_FEE_NUMERATOR = 25;
const TRADING_FEE_DENOMINATOR = 10000;
const OWNER_TRADING_FEE_NUMERATOR = 5;
const OWNER_TRADING_FEE_DENOMINATOR = 10000;
const OWNER_WITHDRAW_FEE_NUMERATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 1;
const OWNER_WITHDRAW_FEE_DENOMINATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 6;
const HOST_FEE_NUMERATOR = 20;
const HOST_FEE_DENOMINATOR = 100;

// Initial amount in each swap token
let currentSwapTokenA = 1000000;
let currentSwapTokenB = 1000000;
let currentFeeAmount = 0;

// Swap instruction constants
// Because there is no withdraw fee in the production version, these numbers
// need to get slightly tweaked in the two cases.
const SWAP_AMOUNT_IN = 100000;
const SWAP_AMOUNT_OUT = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 90661 : 90674;
const SWAP_FEE = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 22727 : 22730;
const HOST_SWAP_FEE = SWAP_PROGRAM_OWNER_FEE_ADDRESS
  ? Math.floor((SWAP_FEE * HOST_FEE_NUMERATOR) / HOST_FEE_DENOMINATOR)
  : 0;
const OWNER_SWAP_FEE = SWAP_FEE - HOST_SWAP_FEE;

// Pool token amount minted on init
const DEFAULT_POOL_TOKEN_AMOUNT = 1000000000;
// Pool token amount to withdraw / deposit
const POOL_TOKEN_AMOUNT = 10000000;

function assert(condition: boolean, message?: string) {
  if (!condition) {
    console.log(Error().stack + ':token-test.js');
    throw message || 'Assertion failed';
  }
}

let connection: Connection;
async function getConnection(): Promise<Connection> {
  if (connection) return connection;

  const url = 'https://api.devnet.solana.com';
  connection = new Connection(url, 'recent');
  const version = await connection.getVersion();

  console.log('Connection to cluster established:', url, version);
  return connection;
}

export async function createTokenSwap(
  curveType: number,
  curveParameters?: Numberu64,
): Promise<void> {
  console.log("Token Program id is ",TOKEN_PROGRAM_ID);
  const connection = await getConnection();
  const secret = JSON.parse(
    fs
      .readFileSync('d5z9TURKyVMKtZg9YE89XW7GTvYd8TJK9MfWAnyG7x1.json')
      .toString(),
  ) as number[];
  const secretKey = Uint8Array.from(secret);
  // const paye= new Account(secretKey);
  // console.log("The Account public key is ",paye.publicKey);
  const payer = new Account(secretKey);
  owner = new Account(secretKey);
  const secretTokenSwap = JSON.parse(
    fs
      .readFileSync('TSAm8mcZYDUiKgkwc9BomrqZG4HPFQnRst42YEoVkgN.json')
      .toString(),
  ) as number[];
  const secretKeyTokenSwap = Uint8Array.from(secretTokenSwap);
  const tokenSwapAccount = new Account(secretKeyTokenSwap);

  console.log("Token swap Account is ",tokenSwapAccount.publicKey);
  [authority, bumpSeed] = await PublicKey.findProgramAddress(
    [tokenSwapAccount.publicKey.toBuffer()],
    TOKEN_SWAP_PROGRAM_ID,
  );

  console.log('The swap authority is ', authority);
  console.log('creating pool mint');
  tokenPool = new PublicKey('3vVQjmFGZpJLpMBfCHMJd8F89fzFMbJLqZ6zjJdG3Kv2');
  // tokenPool = await Token.createMint(
  //   connection,
  //   payer,
  //   authority, //mint
  //   null, // freeze
  //   2,
  //   TOKEN_PROGRAM_ID, //SPL Token program account
  // );
  console.log('');
  console.log('The ProgramID', TOKEN_SWAP_PROGRAM_ID);
  console.log('Pool mint ', tokenPool);

  console.log('creating pool account');
  tokenAccountPool = new PublicKey(
    '7dh8ffutXRZxMvyD6LDZsSCuDfSGxTASfreqUDdeH5Lr',
  );
  // tokenAccountPool = await tokenPool.createAccount(owner.publicKey);
  // const temp=JSON.stringify(tokenAccountPool.toJSON);
  //console.log(tokenAccountPool.toBase58());
  //fs.writeFileSync('tokenAccount.json',tokenAccountPool.toJSON() );

  console.log('The Pool mint account is ', tokenAccountPool);
  const ownerKey = owner.publicKey.toString();
  feeAccount = new PublicKey('A3F6BeRsRXxKBbZczaytJZE4F653RRpNa2mzPyz4AYrH');
  // feeAccount = await tokenPool.createAccount(new PublicKey(ownerKey));
  console.log('The Fee account is ', feeAccount);
  console.log('creating token A');
  // mintA = await Token.createMint(
  //   connection,
  //   payer,
  //   owner.publicKey,
  //   null,
  //   2,
  //   TOKEN_PROGRAM_ID,
  // );
  mintA= new PublicKey("97XEBow8d9otSkNM3SuyKJ5cFaDD6f7u8XVoLxU48bMG");

  console.log('Mint of Token A is ', mintA);
  console.log('creating token A account for swap');
  tokenAccountA = new PublicKey("82MgziLkzUQw2X1aefV9TrfJnS2dLAcKi9C3USNcQvmA")//await mintA.createAccount(authority);
  console.log('token A account for swap is ', tokenAccountA);
  console.log('creating token A account for userAcocunt');
  userAccountA = new PublicKey("3cvfQwYAVqjdZKZmeJvwUsHHDxhhqoFCEJzgEuFenxDh")//await mintA.createAccount(owner.publicKey);
  console.log('token A account for user is ', userAccountA);

  console.log('minting token A to swap');
  //await mintA.mintTo(tokenAccountA, owner, [], currentSwapTokenA);
  console.log('minting token A to USER');
 // await mintA.mintTo(userAccountA, owner, [], currentSwapTokenA);

  console.log('creating token B');
  // mintB = await Token.createMint(
  //   connection,
  //   payer,
  //   owner.publicKey,
  //   null,
  //   2,
  //   TOKEN_PROGRAM_ID,
  // );
  mintB=new PublicKey("umPEWipi6y9gwM67BJ21SYQAseX2oLyfknwZH7oDTGs")

   console.log('creating token B account');
   tokenAccountB = new PublicKey("6R85N6PY2X94zKZ2JxCSTF4ttRDKEZbKx7g9mw56sAjU")//await mintB.createAccount(authority);
   console.log('token B account for swap is ', tokenAccountB);
   console.log('creating token B account for userAcocunt');
   userAccountB = new PublicKey("F7NPLr5z945RGWFwu2zd5U3kSB8mEg2k2p6KTC9FTywT")//await mintB.createAccount(owner.publicKey);
   console.log('token B account for user is ', userAccountB);
 
   console.log('minting token B to swap');
 //  await mintB.mintTo(tokenAccountB, owner, [], currentSwapTokenB);
   console.log('minting token B to USER');
 //  await mintB.mintTo(userAccountB, owner, [], currentSwapTokenB);

   console.log('creating token swap');
  // const swapPayer = await newAccountWithLamports(connection, 1000000000);
   tokenSwap = await TokenSwap.createTokenSwap(
   connection,
     owner,
     tokenSwapAccount,
     authority,
     tokenAccountA,
     tokenAccountB,
     tokenPool,//.publicKey,
     mintA,//.publicKey,
     mintB,//.publicKey,
     feeAccount,
     tokenAccountPool,
   TOKEN_SWAP_PROGRAM_ID,
     TOKEN_PROGRAM_ID,
     TRADING_FEE_NUMERATOR,
     TRADING_FEE_DENOMINATOR,
     OWNER_TRADING_FEE_NUMERATOR,
     OWNER_TRADING_FEE_DENOMINATOR,
     OWNER_WITHDRAW_FEE_NUMERATOR,
     OWNER_WITHDRAW_FEE_DENOMINATOR,
    HOST_FEE_NUMERATOR,
     HOST_FEE_DENOMINATOR,
     curveType,
     curveParameters,
   );

   console.log('loading token swap');
   const fetchedTokenSwap = await TokenSwap.loadTokenSwap(
     connection,
     tokenSwapAccount.publicKey,
     TOKEN_SWAP_PROGRAM_ID,
     owner,
   );
  tokenSwap=fetchedTokenSwap;

   assert(fetchedTokenSwap.poolTokenProgramId.equals(TOKEN_PROGRAM_ID));
   assert(fetchedTokenSwap.tokenAccountA.equals(tokenAccountA));
   assert(fetchedTokenSwap.tokenAccountB.equals(tokenAccountB));
   assert(fetchedTokenSwap.mintA.equals(mintA));
   assert(fetchedTokenSwap.mintB.equals(mintB));
   assert(fetchedTokenSwap.poolToken.equals(tokenPool));
   assert(fetchedTokenSwap.feeAccount.equals(feeAccount));
   assert(
     TRADING_FEE_NUMERATOR == fetchedTokenSwap.tradeFeeNumerator.toNumber(),
   );
  // assert(
  //   TRADING_FEE_DENOMINATOR == fetchedTokenSwap.tradeFeeDenominator.toNumber(),
  // );
  // assert(
  //   OWNER_TRADING_FEE_NUMERATOR ==
  //     fetchedTokenSwap.ownerTradeFeeNumerator.toNumber(),
  // );
  // assert(
  //   OWNER_TRADING_FEE_DENOMINATOR ==
  //     fetchedTokenSwap.ownerTradeFeeDenominator.toNumber(),
  // );
  // assert(
  //   OWNER_WITHDRAW_FEE_NUMERATOR ==
  //     fetchedTokenSwap.ownerWithdrawFeeNumerator.toNumber(),
  // );
  // assert(
  //   OWNER_WITHDRAW_FEE_DENOMINATOR ==
  //     fetchedTokenSwap.ownerWithdrawFeeDenominator.toNumber(),
  // );
  // assert(HOST_FEE_NUMERATOR == fetchedTokenSwap.hostFeeNumerator.toNumber());
  // assert(
  //   HOST_FEE_DENOMINATOR == fetchedTokenSwap.hostFeeDenominator.toNumber(),
  // );
  // assert(curveType == fetchedTokenSwap.curveType);
}

export async function depositAllTokenTypes(): Promise<void> {

 // const poolMintInfo = await tokenPool.getMintInfo();
  
  const supply = POOL_TOKEN_AMOUNT;
  const swapTokenA =currentSwapTokenA;
  const tokenA = 1000 //Math.floor(
  //   (swapTokenA * POOL_TOKEN_AMOUNT) / supply,
  // );
   const swapTokenB =1000// currentSwapTokenB;
   const tokenB = 1000// Math.floor(
  //   (swapTokenB * POOL_TOKEN_AMOUNT) / supply,
  // );
  // USer Wallet here 
  const secret = JSON.parse(
    fs
      .readFileSync('USrfuTpRqKFdNpk38inSGF88jAhNRaQBxy6UKTKFzAn.json')
      .toString(),
  ) as number[];
  const secretKey = await Uint8Array.from(secret);
  //USrfuTpRqKFdNpk38inSGF88jAhNRaQBxy6UKTKFzAn
  const userTransferAuthority = new Account(secretKey);
  console.log('Loading depositor token a account',userTransferAuthority);
  const userAccountA = new PublicKey("7KKdwkXxMNgX6bTpXHmSx45fDoAY8EZ21V13r3xbcDzY")//await mintA.createAccount(owner.publicKey);
  // await mintA.mintTo(userAccountA, owner, [], tokenA);
  // await mintA.approve(
  //   userAccountA,
  //   userTransferAuthority.publicKey,
  //   owner,
  //   [],
  //   tokenA,
  // );
  console.log('Creating depositor token b account');
  const userAccountB = new PublicKey("3MtNf3YzYbaY6vjafQb32V68JRaanbcibzem89dvLwky")//await mintB.createAccount(owner.publicKey);
  // await mintB.mintTo(userAccountB, owner, [], tokenB);
  // await mintB.approve(
  //   userAccountB,
  //   userTransferAuthority.publicKey,
  //   owner,
  //   [],
  //   tokenB,
  // );
  console.log('Creating depositor pool token account');
  const newAccountPool = new PublicKey("CZ7ViCwA8SonrtujPgXK6U8J5DoLnBFnzsMjXhpACc5N")//await tokenPool.createAccount(owner.publicKey);

  const confirmOptions = {
    skipPreflight: true,
  };

  console.log('Depositing into swap');
  console.log("user Account ",userAccountA)
  console.log("user Account B",userAccountB)
  console.log("newAccountPool",newAccountPool)
  console.log("TOKEN_PROGRAM_ID",TOKEN_PROGRAM_ID)
  

 const e= await tokenSwap.depositAllTokenTypes(
    userAccountA,
    userAccountB,
    newAccountPool,
    TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    userTransferAuthority,
    1000000,     
    10000,
    10000,
    confirmOptions,
  );
console.log("Signature",e)
 

  //let info;
  // info = await mintA.getAccountInfo(userAccountA);
  // assert(info.amount.toNumber() == 0);
  // info = await mintB.getAccountInfo(userAccountB);
  // assert(info.amount.toNumber() == 0);
  // info = await mintA.getAccountInfo(tokenAccountA);
  // assert(info.amount.toNumber() == currentSwapTokenA + tokenA);
  // currentSwapTokenA += tokenA;
  // info = await mintB.getAccountInfo(tokenAccountB);
  // assert(info.amount.toNumber() == currentSwapTokenB + tokenB);
  // currentSwapTokenB += tokenB;
  // info = await tokenPool.getAccountInfo(newAccountPool);
  // assert(info.amount.toNumber() == POOL_TOKEN_AMOUNT);
}

export async function withdrawAllTokenTypes(): Promise<void> {
  // const poolMintInfo = await tokenPool.getMintInfo();
  // const supply = poolMintInfo.supply.toNumber();
  // let swapTokenA = await mintA.getAccountInfo(tokenAccountA);
  // let swapTokenB = await mintB.getAccountInfo(tokenAccountB);
  // let feeAmount = 0;
  // if (OWNER_WITHDRAW_FEE_NUMERATOR !== 0) {
  //   feeAmount = Math.floor(
  //     (POOL_TOKEN_AMOUNT * OWNER_WITHDRAW_FEE_NUMERATOR) /
  //       OWNER_WITHDRAW_FEE_DENOMINATOR,
  //   );
  // }
  // const poolTokenAmount = POOL_TOKEN_AMOUNT - feeAmount;
  // const tokenA = Math.floor(
  //   (swapTokenA.amount.toNumber() * poolTokenAmount) / supply,
  // );
  // const tokenB = Math.floor(
  //   (swapTokenB.amount.toNumber() * poolTokenAmount) / supply,
  // );

  // console.log('Creating withdraw token A account');
  // let userAccountA = await mintA.createAccount(owner.publicKey);
  // console.log('Creating withdraw token B account');
  // let userAccountB = await mintB.createAccount(owner.publicKey);

  // const userTransferAuthority = new Account();
  // console.log('Approving withdrawal from pool account');
  // await tokenPool.approve(
  //   tokenAccountPool,
  //   userTransferAuthority.publicKey,
  //   owner,
  //   [],
  //   POOL_TOKEN_AMOUNT,
  // );

  // const confirmOptions = {
  //   skipPreflight: true,
  // };

  // console.log('Withdrawing pool tokens for A and B tokens');
  // await tokenSwap.withdrawAllTokenTypes(
  //   userAccountA,
  //   userAccountB,
  //   tokenAccountPool,
  //   TOKEN_PROGRAM_ID,
  //   TOKEN_PROGRAM_ID,
  //   userTransferAuthority,
  //   POOL_TOKEN_AMOUNT,
  //   tokenA,
  //   tokenB,
  //   confirmOptions,
  // );

  // //const poolMintInfo = await tokenPool.getMintInfo();
  // swapTokenA = await mintA.getAccountInfo(tokenAccountA);
  // swapTokenB = await mintB.getAccountInfo(tokenAccountB);

  // let info = await tokenPool.getAccountInfo(tokenAccountPool);
  // assert(
  //   info.amount.toNumber() == DEFAULT_POOL_TOKEN_AMOUNT - POOL_TOKEN_AMOUNT,
  // );
  // assert(swapTokenA.amount.toNumber() == currentSwapTokenA - tokenA);
  // currentSwapTokenA -= tokenA;
  // assert(swapTokenB.amount.toNumber() == currentSwapTokenB - tokenB);
  // currentSwapTokenB -= tokenB;
  // info = await mintA.getAccountInfo(userAccountA);
  // assert(info.amount.toNumber() == tokenA);
  // info = await mintB.getAccountInfo(userAccountB);
  // assert(info.amount.toNumber() == tokenB);
  // info = await tokenPool.getAccountInfo(feeAccount);
  // assert(info.amount.toNumber() == feeAmount);
  // currentFeeAmount = feeAmount;
}

// export async function createAccountAndSwapAtomic(): Promise<void> {
//   console.log('Creating swap token a account');
//   let userAccountA = await mintA.createAccount(owner.publicKey);
//   await mintA.mintTo(userAccountA, owner, [], SWAP_AMOUNT_IN);

//   // @ts-ignore
//   const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(
//     connection,
//   );
//   const newAccount = new Account();
//   const transaction = new Transaction();
//   transaction.add(
//     SystemProgram.createAccount({
//       fromPubkey: owner.publicKey,
//       newAccountPubkey: newAccount.publicKey,
//       lamports: balanceNeeded,
//       space: AccountLayout.span,
//       programId: mintB.programId,
//     }),
//   );

//   transaction.add(
//     Token.createInitAccountInstruction(
//       mintB.programId,
//       mintB.publicKey,
//       newAccount.publicKey,
//       owner.publicKey,
//     ),
//   );

//   const userTransferAuthority = new Account();
//   transaction.add(
//     Token.createApproveInstruction(
//       mintA.programId,
//       userAccountA,
//       userTransferAuthority.publicKey,
//       owner.publicKey,
//       [owner],
//       SWAP_AMOUNT_IN,
//     ),
//   );

//   transaction.add(
//     TokenSwap.swapInstruction(
//       tokenSwap.tokenSwap,
//       tokenSwap.authority,
//       userTransferAuthority.publicKey,
//       userAccountA,
//       tokenSwap.tokenAccountA,
//       tokenSwap.tokenAccountB,
//       newAccount.publicKey,
//       tokenSwap.poolToken,
//       tokenSwap.feeAccount,
//       null,
//       tokenSwap.mintA,
//       tokenSwap.mintB,
//       tokenSwap.swapProgramId,
//       TOKEN_PROGRAM_ID,
//       TOKEN_PROGRAM_ID,
//       tokenSwap.poolTokenProgramId,
//       SWAP_AMOUNT_IN,
//       0,
//     ),
//   );

//   const confirmOptions = {
//     skipPreflight: true,
//   };

//   // Send the instructions
//   console.log('sending big instruction');
//   await sendAndConfirmTransaction(
//     connection,
//     transaction,
//     [owner, newAccount, userTransferAuthority],
//     confirmOptions,
//   );

//   let info;
//   info = await mintA.getAccountInfo(tokenAccountA);
//   currentSwapTokenA = info.amount.toNumber();
//   info = await mintB.getAccountInfo(tokenAccountB);
//   currentSwapTokenB = info.amount.toNumber();
// }

export async function swap(): Promise<void> {
  console.log('Creating swap token a account');
  const userAccountA = new PublicKey("7KKdwkXxMNgX6bTpXHmSx45fDoAY8EZ21V13r3xbcDzY")//await mintA.createAccount(owner.publicKey);
  // await mintA.mintTo(userAccountA, owner, [], SWAP_AMOUNT_IN);
  // const userTransferAuthority = new Account();
  // await mintA.approve(
  //   userAccountA,
  //   userTransferAuthority.publicKey,
  //   owner,
  //   [],
  //   SWAP_AMOUNT_IN,
  // );
  console.log('Creating swap token b account');
  const userAccountB = new PublicKey("3MtNf3YzYbaY6vjafQb32V68JRaanbcibzem89dvLwky")//await mintB.createAccount(owner.publicKey);
  // let poolAccount = SWAP_PROGRAM_OWNER_FEE_ADDRESS
  //   ? await tokenPool.createAccount(owner.publicKey)
  //   : null;
  const newAccountPool = new PublicKey("CZ7ViCwA8SonrtujPgXK6U8J5DoLnBFnzsMjXhpACc5N")//await tokenPool.createAccount(owner.publicKey);

  const secret = JSON.parse(
    fs
      .readFileSync('USrfuTpRqKFdNpk38inSGF88jAhNRaQBxy6UKTKFzAn.json')
      .toString(),
  ) as number[];
  const secretKey = await Uint8Array.from(secret);
  //USrfuTpRqKFdNpk38inSGF88jAhNRaQBxy6UKTKFzAn
  const userTransferAuthority = new Account(secretKey);


  const confirmOptions = {
    skipPreflight: true,
  };

  console.log('Swapping');



  const e=await tokenSwap.swap(
    userAccountA, // userAccountA,
    tokenAccountA, // tokenAccountA,
    tokenAccountB,//  tokenAccountB,
    userAccountB,//  userAccountB,
    tokenSwap.mintA,//tokenSwap.mintA,
    tokenSwap.mintB,// tokenSwap.mintB,
    TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    newAccountPool,
    userTransferAuthority,
    SWAP_AMOUNT_IN,
    SWAP_AMOUNT_OUT,
    confirmOptions,
  );



  // const e=await tokenSwap.swap(
  //   userAccountB, // userAccountA,
  //   tokenAccountB, // tokenAccountA,
  //   tokenAccountA,//  tokenAccountB,
  //   userAccountA,//  userAccountB,
  //   tokenSwap.mintB,//tokenSwap.mintA,
  //   tokenSwap.mintA,// tokenSwap.mintB,
  //   TOKEN_PROGRAM_ID,
  //   TOKEN_PROGRAM_ID,
  //   newAccountPool,
  //   userTransferAuthority,
  //   SWAP_AMOUNT_IN,
  //   SWAP_AMOUNT_OUT,
  //   confirmOptions,
  // );
  await sleep(500);
console.log("Sigx",e)
  // await sleep(500);

  // let info;
  // info = await mintA.getAccountInfo(userAccountA);
  // assert(info.amount.toNumber() == 0);

  // info = await mintB.getAccountInfo(userAccountB);
  // assert(info.amount.toNumber() == SWAP_AMOUNT_OUT);

  // info = await mintA.getAccountInfo(tokenAccountA);
  // assert(info.amount.toNumber() == currentSwapTokenA + SWAP_AMOUNT_IN);
  // currentSwapTokenA += SWAP_AMOUNT_IN;

  // info = await mintB.getAccountInfo(tokenAccountB);
  // assert(info.amount.toNumber() == currentSwapTokenB - SWAP_AMOUNT_OUT);
  // currentSwapTokenB -= SWAP_AMOUNT_OUT;

  // info = await tokenPool.getAccountInfo(tokenAccountPool);
  // assert(
  //   info.amount.toNumber() == DEFAULT_POOL_TOKEN_AMOUNT - POOL_TOKEN_AMOUNT,
  // );

  // info = await tokenPool.getAccountInfo(feeAccount);
  // assert(info.amount.toNumber() == currentFeeAmount + OWNER_SWAP_FEE);

  // if (poolAccount != null) {
  //   info = await tokenPool.getAccountInfo(poolAccount);
  //   assert(info.amount.toNumber() == HOST_SWAP_FEE);
  // }
}

// function tradingTokensToPoolTokens(
//   sourceAmount: number,
//   swapSourceAmount: number,
//   poolAmount: number,
// ): number {
//   const tradingFee =
//     (sourceAmount / 2) * (TRADING_FEE_NUMERATOR / TRADING_FEE_DENOMINATOR);
//   const ownerTradingFee =
//     (sourceAmount / 2) *
//     (OWNER_TRADING_FEE_NUMERATOR / OWNER_TRADING_FEE_DENOMINATOR);
//   const sourceAmountPostFee = sourceAmount - tradingFee - ownerTradingFee;
//   const root = Math.sqrt(sourceAmountPostFee / swapSourceAmount + 1);
//   return Math.floor(poolAmount * (root - 1));
// }

// export async function depositSingleTokenTypeExactAmountIn(): Promise<void> {
//   // Pool token amount to deposit on one side
//   const depositAmount = 10000;

//   const poolMintInfo = await tokenPool.getMintInfo();
//   const supply = poolMintInfo.supply.toNumber();
//   const swapTokenA = await mintA.getAccountInfo(tokenAccountA);
//   const poolTokenA = tradingTokensToPoolTokens(
//     depositAmount,
//     swapTokenA.amount.toNumber(),
//     supply,
//   );
//   const swapTokenB = await mintB.getAccountInfo(tokenAccountB);
//   const poolTokenB = tradingTokensToPoolTokens(
//     depositAmount,
//     swapTokenB.amount.toNumber(),
//     supply,
//   );

//   const userTransferAuthority = new Account();
//   console.log('Creating depositor token a account');
//   const userAccountA = await mintA.createAccount(owner.publicKey);
//   await mintA.mintTo(userAccountA, owner, [], depositAmount);
//   await mintA.approve(
//     userAccountA,
//     userTransferAuthority.publicKey,
//     owner,
//     [],
//     depositAmount,
//   );
//   console.log('Creating depositor token b account');
//   const userAccountB = await mintB.createAccount(owner.publicKey);
//   await mintB.mintTo(userAccountB, owner, [], depositAmount);
//   await mintB.approve(
//     userAccountB,
//     userTransferAuthority.publicKey,
//     owner,
//     [],
//     depositAmount,
//   );
//   console.log('Creating depositor pool token account');
//   const newAccountPool = await tokenPool.createAccount(owner.publicKey);

//   const confirmOptions = {
//     skipPreflight: true,
//   };

//   console.log('Depositing token A into swap');
//   await tokenSwap.depositSingleTokenTypeExactAmountIn(
//     userAccountA,
//     newAccountPool,
//     tokenSwap.mintA,
//     TOKEN_PROGRAM_ID,
//     userTransferAuthority,
//     depositAmount,
//     poolTokenA,
//     confirmOptions,
//   );

//   let info;
//   info = await mintA.getAccountInfo(userAccountA);
//   assert(info.amount.toNumber() == 0);
//   info = await mintA.getAccountInfo(tokenAccountA);
//   assert(info.amount.toNumber() == currentSwapTokenA + depositAmount);
//   currentSwapTokenA += depositAmount;

//   console.log('Depositing token B into swap');
//   await tokenSwap.depositSingleTokenTypeExactAmountIn(
//     userAccountB,
//     newAccountPool,
//     tokenSwap.mintB,
//     TOKEN_PROGRAM_ID,
//     userTransferAuthority,
//     depositAmount,
//     poolTokenB,
//     confirmOptions,
//   );

//   info = await mintB.getAccountInfo(userAccountB);
//   assert(info.amount.toNumber() == 0);
//   info = await mintB.getAccountInfo(tokenAccountB);
//   assert(info.amount.toNumber() == currentSwapTokenB + depositAmount);
//   currentSwapTokenB += depositAmount;
//   info = await tokenPool.getAccountInfo(newAccountPool);
//   assert(info.amount.toNumber() >= poolTokenA + poolTokenB);
// }

// export async function withdrawSingleTokenTypeExactAmountOut(): Promise<void> {
//   // Pool token amount to withdraw on one side
//   const withdrawAmount = 50000;
//   const roundingAmount = 1.0001; // make math a little easier

//   const poolMintInfo = await tokenPool.getMintInfo();
//   const supply = poolMintInfo.supply.toNumber();

//   const swapTokenA = await mintA.getAccountInfo(tokenAccountA);
//   const swapTokenAPost = swapTokenA.amount.toNumber() - withdrawAmount;
//   const poolTokenA = tradingTokensToPoolTokens(
//     withdrawAmount,
//     swapTokenAPost,
//     supply,
//   );
//   let adjustedPoolTokenA = poolTokenA * roundingAmount;
//   if (OWNER_WITHDRAW_FEE_NUMERATOR !== 0) {
//     adjustedPoolTokenA *=
//       1 + OWNER_WITHDRAW_FEE_NUMERATOR / OWNER_WITHDRAW_FEE_DENOMINATOR;
//   }

//   const swapTokenB = await mintB.getAccountInfo(tokenAccountB);
//   const swapTokenBPost = swapTokenB.amount.toNumber() - withdrawAmount;
//   const poolTokenB = tradingTokensToPoolTokens(
//     withdrawAmount,
//     swapTokenBPost,
//     supply,
//   );
//   let adjustedPoolTokenB = poolTokenB * roundingAmount;
//   if (OWNER_WITHDRAW_FEE_NUMERATOR !== 0) {
//     adjustedPoolTokenB *=
//       1 + OWNER_WITHDRAW_FEE_NUMERATOR / OWNER_WITHDRAW_FEE_DENOMINATOR;
//   }

//   const userTransferAuthority = new Account();
//   console.log('Creating withdraw token a account');
//   const userAccountA = await mintA.createAccount(owner.publicKey);
//   console.log('Creating withdraw token b account');
//   const userAccountB = await mintB.createAccount(owner.publicKey);
//   console.log('Creating withdraw pool token account');
//   const poolAccount = await tokenPool.getAccountInfo(tokenAccountPool);
//   const poolTokenAmount = poolAccount.amount.toNumber();
//   await tokenPool.approve(
//     tokenAccountPool,
//     userTransferAuthority.publicKey,
//     owner,
//     [],
//     adjustedPoolTokenA + adjustedPoolTokenB,
//   );

//   const confirmOptions = {
//     skipPreflight: true,
//   };

//   console.log('Withdrawing token A only');
//   await tokenSwap.withdrawSingleTokenTypeExactAmountOut(
//     userAccountA,
//     tokenAccountPool,
//     tokenSwap.mintA,
//     TOKEN_PROGRAM_ID,
//     userTransferAuthority,
//     withdrawAmount,
//     adjustedPoolTokenA,
//     confirmOptions,
//   );

//   let info;
//   info = await mintA.getAccountInfo(userAccountA);
//   assert(info.amount.toNumber() == withdrawAmount);
//   info = await mintA.getAccountInfo(tokenAccountA);
//   assert(info.amount.toNumber() == currentSwapTokenA - withdrawAmount);
//   currentSwapTokenA += withdrawAmount;
//   info = await tokenPool.getAccountInfo(tokenAccountPool);
//   assert(info.amount.toNumber() >= poolTokenAmount - adjustedPoolTokenA);

//   console.log('Withdrawing token B only');
//   await tokenSwap.withdrawSingleTokenTypeExactAmountOut(
//     userAccountB,
//     tokenAccountPool,
//     tokenSwap.mintB,
//     TOKEN_PROGRAM_ID,
//     userTransferAuthority,
//     withdrawAmount,
//     adjustedPoolTokenB,
//     confirmOptions,
//   );

//   info = await mintB.getAccountInfo(userAccountB);
//   assert(info.amount.toNumber() == withdrawAmount);
//   info = await mintB.getAccountInfo(tokenAccountB);
//   assert(info.amount.toNumber() == currentSwapTokenB - withdrawAmount);
//   currentSwapTokenB += withdrawAmount;
//   //info = await tokenPool.getAccountInfo(tokenAccountPool);
//   assert(
//     info.amount.toNumber() >=
//       poolTokenAmount - adjustedPoolTokenA - adjustedPoolTokenB,
//   );
//}