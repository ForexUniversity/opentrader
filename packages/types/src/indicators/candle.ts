import { IndicatorName, IndicatorsResult } from "./indicators.js";

export type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/**
 * Enhanced candle with indicators
 */
export type XCandle<I extends IndicatorName> = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  indicators: IndicatorsResult<I>;
};
