import big from 'big.js';
import { OrderStatusEnum } from 'src/core/db/types/common/enums/order-status.enum';
import { IGridBotLevel } from 'src/grid-bot/types/grid-bot-level.interface';

export type CalculateInvestmentResult = {
  baseCurrencyAmount: number;
  quoteCurrencyAmount: number;
};

/**
 * Calculate Investment in Base and Quote currencies
 * required to place Buy/Sell limit orders on the exchange.
 *
 * @param deals
 */
export function calculateInvestment(gridLevels: IGridBotLevel[]): CalculateInvestmentResult {
  let baseCurrencyAmount = gridLevels.reduce((amount, gridLevel) => {
    const isSellWaiting =
      gridLevel.buy.status === OrderStatusEnum.Filled
      gridLevel.sell.status === OrderStatusEnum.Idle

    if (isSellWaiting) {
      return big(amount).plus(gridLevel.sell.quantity).toNumber();
    }

    return amount;
  }, 0);

  let quoteCurrencyAmount = gridLevels.reduce((amount, gridLevel) => {
    const isBuyWaiting = 
      gridLevel.buy.status === OrderStatusEnum.Idle &&
      gridLevel.sell.status === OrderStatusEnum.Idle

    if (isBuyWaiting) {
      const quoteAmountPerGrid = big(gridLevel.buy.quantity).times(gridLevel.buy.price);

      return big(amount).plus(quoteAmountPerGrid).toNumber();
    }

    return amount;
  }, 0);

  return { baseCurrencyAmount, quoteCurrencyAmount };
}
