import { ZBot } from "@opentrader/db";
import { z } from "zod";

export const ZUpdateBotInputSchema = z.object({
  botId: z.number(),
  data: ZBot.pick({
    name: true,
    baseCurrency: true,
    quoteCurrency: true,
    settings: true,
    template: true,
    timeframe: true,
    exchangeAccountId: true,
  }),
});

export type TUpdateBotInputSchema = z.infer<typeof ZUpdateBotInputSchema>;
