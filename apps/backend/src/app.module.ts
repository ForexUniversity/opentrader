import { HttpModule } from '@nestjs/axios';
import { WinstonModule } from 'nest-winston';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { Environment } from 'src/common/enums/environment.enum';
import {
  winstonJsonConsoleTransport,
  winstonNestLikeTransport,
} from 'src/common/helpers/logging/logging-transports';
import { marketsApiConfig } from 'src/config/markets-api.config';
import { envValidation } from 'src/config/utils/envValidationSchema';
import { CoreModule } from 'src/core/core.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';
import { ExchangeAccountsWatcher } from 'src/core/exchange-bus/exchange-accounts.watcher';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.development.local'],
      load: [marketsApiConfig],
      validationSchema: envValidation,
      isGlobal: true,
    }),
    HttpModule,
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDevelopment =
          config.get<string>('ENVIRONMENT') === Environment.Development;

        return {
          transports: [
            ...(isDevelopment
              ? [winstonNestLikeTransport]
              : [winstonJsonConsoleTransport]),
          ],
        };
      },
    }),
    ScheduleModule.forRoot(),
    CoreModule,
    AppModule,
  ],
  providers: [AppService, Logger],
  controllers: [AppController],
})
export class AppModule {
  private readonly logger = new Logger(AppModule.name);

  constructor(private exchangeAccountsWatcher: ExchangeAccountsWatcher) {}

  async onApplicationBootstrap() {
    this.logger.log(
      'onApplicationBootstrap: ExchangeAccountsWatcher -> create()',
    );
    await this.exchangeAccountsWatcher.create();
  }

  async beforeApplicationShutdown() {
    this.logger.log(
      'beforeApplicationShutdown: ExchangeAccountsWatcher -> destroy()',
    );
    await this.exchangeAccountsWatcher.destroy();
  }
}
