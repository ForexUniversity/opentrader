import { ExchangeCode } from "@opentrader/types";
import {
  CURRENCY_PAIR_DELIMITER,
  EXCHANGE_CODE_DELIMITER,
} from "./constants.js";
import { isValidSymbolId } from "./isValidSymbolId.js";

export type DecomposeSymbolIdResult = {
  exchangeCode: ExchangeCode;
  baseCurrency: string;
  quoteCurrency: string;
  currencyPairSymbol: string;
};

export function decomposeSymbolId(symbolId: string): DecomposeSymbolIdResult {
  if (!isValidSymbolId(symbolId)) {
    throw new Error(`${symbolId} is not a valid symbolId`);
  }

  const [exchangeCodeKey, currencyPairSymbol] = symbolId.split(
    EXCHANGE_CODE_DELIMITER,
  );
  const [baseCurrency, quoteCurrency] = currencyPairSymbol!.split(
    CURRENCY_PAIR_DELIMITER,
  );

  return {
    exchangeCode: ExchangeCode[exchangeCodeKey as keyof typeof ExchangeCode],
    currencyPairSymbol: currencyPairSymbol!,
    baseCurrency: baseCurrency!,
    quoteCurrency: quoteCurrency!,
  };
}
