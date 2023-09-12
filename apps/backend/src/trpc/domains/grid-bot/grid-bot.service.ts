import { BotProcessor } from '@bifrost/bot-processor';
import { arithmeticGridBot, GridBotConfig } from '@bifrost/bot-templates';
import { exchanges } from '@bifrost/exchanges';
import { TRPCError } from '@trpc/server';
import { GridBotStoreAdapter } from 'src/trpc/domains/grid-bot/processing/grid-bot-store-adapter';
import { xprisma } from 'src/trpc/prisma';
import { TGridBot } from 'src/trpc/prisma/types/grid-bot/grid-bot.schema';

export class GridBotService {
  constructor(private bot: TGridBot) {}

  static async fromId(id: number) {
    const bot = await xprisma.bot.grid.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        exchangeAccount: true,
      },
    });

    return new GridBotService(bot);
  }

  async start() {
    this.bot = await xprisma.bot.grid.update({
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

  async stop() {
    this.bot = await xprisma.bot.grid.update({
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

  async processStartCommand() {
    const processor = await this.getProcessor();
    await processor.start();
  }

  async processStopCommand() {
    const processor = await this.getProcessor();
    await processor.stop();
  }

  async process() {
    const processor = await this.getProcessor();
    await processor.process();
  }

  assertIsRunning() {
    if (!this.bot.enabled) {
      throw new TRPCError({
        message: 'Bot is not enabled',
        code: 'CONFLICT',
      });
    }
  }

  assertIsNotAlreadyRunning() {
    if (this.bot.enabled) {
      throw new TRPCError({
        message: 'Bot already running',
        code: 'CONFLICT',
      });
    }
  }

  assertIsNotAlreadyStopped() {
    if (!this.bot.enabled) {
      throw new TRPCError({
        message: 'Bot already stopped',
        code: 'CONFLICT',
      });
    }
  }

  private async getProcessor() {
    const exchange = await xprisma.exchangeAccount.findUniqueOrThrow({
      where: {
        id: this.bot.exchangeAccountId,
      },
    });
    const exchangeService = exchanges[exchange.exchangeCode](
      exchange.credentials,
    );

    const configuration: GridBotConfig = {
      id: this.bot.id,
      baseCurrency: this.bot.baseCurrency,
      quoteCurrency: this.bot.quoteCurrency,
      gridLines: this.bot.settings.gridLines,
    };

    const storeAdapter = new GridBotStoreAdapter(xprisma, this.bot, () =>
      this.stop(),
    );

    const processor = BotProcessor.create({
      store: storeAdapter,
      exchange: exchangeService,
      botConfig: configuration,
      botTemplate: arithmeticGridBot,
    });

    return processor;
  }
}
