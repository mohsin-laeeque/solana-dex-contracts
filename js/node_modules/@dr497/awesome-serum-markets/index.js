const solana = require("@solana/web3.js");
const Markets = require("./markets.json");
const Tokens = require("./tokens.json");

const AWESOME_MARKETS = Markets.map(market => {
  return {
    address: new solana.PublicKey(market.address),
    name: market.name,
    programId: new solana.PublicKey(market.programId),
    deprecated: market.deprecated
  };
});

const AWESOME_TOKENS = Tokens.map(token => {
  return {
    name: token.name,
    address: new solana.PublicKey(token.address)
  };
});

module.exports = {
  AWESOME_MARKETS: AWESOME_MARKETS,
  AWESOME_TOKENS: AWESOME_TOKENS
};
