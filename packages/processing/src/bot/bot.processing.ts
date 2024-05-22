import type {
  BotState,
  IBotConfiguration,
  MarketData,
} from "@opentrader/bot-processor";
import { createStrategyRunner } from "@opentrader/bot-processor";
import { findTemplate } from "@opentrader/bot-templates";
import { exchangeProvider } from "@opentrader/exchanges";
import type { TBot } from "@opentrader/db";
import { xprisma } from "@opentrader/db";
import { logger } from "@opentrader/logger";
import { SmartTradeExecutor } from "../executors";
import { BotStoreAdapter } from "./bot-store-adapter";

export class BotProcessing {
  constructor(private bot: TBot) {}

  static async fromId(id: number) {
    const bot = await xprisma.bot.custom.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        exchangeAccount: true,
      },
    });

    return new BotProcessing(bot);
  }

  static async fromSmartTradeId(smartTradeId: number) {
    const bot = await xprisma.bot.custom.findFirstOrThrow({
      where: {
        smartTrades: {
          some: {
            id: smartTradeId,
          },
        },
      },
      include: {
        exchangeAccount: true,
      },
    });

    return new BotProcessing(bot);
  }

  private async start() {
    this.bot = await xprisma.bot.custom.update({
      where: {
        id: this.bot.id,
      },
      data: {
        enabled: true,
      },
      include: {
        exchangeAccount: true,
      },
    });
  }

  private async stop() {
    this.bot = await xprisma.bot.custom.update({
      where: {
        id: this.bot.id,
      },
      data: {
        enabled: false,
      },
      include: {
        exchangeAccount: true,
      },
    });
  }

  async processCommand(
    command: "start" | "stop" | "process",
    market?: MarketData,
  ) {
    console.log(
      `🤖 Processing "${command}" command. Context { candle=${JSON.stringify(market?.candle)}, candlesHistory=${market?.candles.length || 0} }. Bot { id: ${this.bot.id}, name: ${this.bot.name} }`,
    );
    if (this.isBotProcessing()) {
      console.warn(
        `Cannot execute "${command}()" command. The bot is busy right now by the previous processing job.`,
      );
      return;
    }

    const processor = await this.getProcessor();
    const botState = this.bot.state as BotState;

    await xprisma.bot.setProcessing(true, this.bot.id);
    try {
      if (command === "start") {
        await processor.start(botState);
      } else if (command === "stop") {
        await processor.stop(botState);
      } else if (command === "process") {
        await processor.process(botState, market);
      }
    } catch (err) {
      await xprisma.bot.setProcessing(false, this.bot.id);

      throw err;
    }

    await xprisma.bot.setProcessing(false, this.bot.id);
    await xprisma.bot.updateState(botState, this.bot.id);
    console.log(
      `🤖 Processing "${command}" command finished. Bot { id: ${this.bot.id}, name: ${this.bot.name} }`,
    );
  }

  async processStartCommand() {
    await this.processCommand("start");
  }

  async processStopCommand() {
    await this.processCommand("stop");
  }

  async process(market?: MarketData) {
    await this.processCommand("process", market);
  }

  isBotRunning() {
    return this.bot.enabled;
  }

  isBotStopped() {
    return !this.bot.enabled;
  }

  isBotProcessing() {
    return this.bot.processing;
  }

  getId() {
    return this.bot.id;
  }

  getTimeframe() {
    return this.bot.timeframe;
  }

  private async getProcessor() {
    const exchangeAccount = await xprisma.exchangeAccount.findUniqueOrThrow({
      where: {
        id: this.bot.exchangeAccountId,
      },
    });

    const exchange = exchangeProvider.fromAccount(exchangeAccount);

    const configuration: IBotConfiguration = {
      id: this.bot.id,
      baseCurrency: this.bot.baseCurrency,
      quoteCurrency: this.bot.quoteCurrency,
      settings: this.bot.settings,
      exchangeCode: exchangeAccount.exchangeCode,
    };

    const storeAdapter = new BotStoreAdapter(() => this.stop());
    const botTemplate = findTemplate(this.bot.template);

    const processor = createStrategyRunner({
      store: storeAdapter,
      exchange,
      botConfig: configuration,
      botTemplate,
    });

    return processor;
  }

  async placePendingOrders() {
    const smartTrades = await xprisma.smartTrade.findMany({
      where: {
        type: "Trade",
        orders: {
          some: {
            status: "Idle",
          },
        },
        bot: {
          id: this.bot.id,
        },
      },
      include: {
        exchangeAccount: true,
        orders: true,
      },
    });

    logger.info(`BotProcessing: Found ${smartTrades.length} pending orders for placement`);

    for (const smartTrade of smartTrades) {
      const { exchangeAccount } = smartTrade;

      logger.info(
        `Executed next() for SmartTrade { id: ${smartTrade.id}, symbol: ${smartTrade.exchangeSymbolId}, exchangeCode: ${exchangeAccount.exchangeCode} }`,
      );

      const smartTradeExecutor = SmartTradeExecutor.create(
        smartTrade,
        exchangeAccount,
      );
      await smartTradeExecutor.next();
    }
  }
}
