import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { Stock } from './entity/stock.entity';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  private readonly finnhubApiKey = 'ciqlqj9r01qjff7cr300ciqlqj9r01qjff7cr30g';
  private readonly stockPrices: { [key: string]: number[] } = {};

  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  private async fetchStockPrice(symbol: string) {
    try {
      const response = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.finnhubApiKey}`,
      );
      const price = response.data.c;
      this.logger.log(response.data);
      this.logger.log(this.stockPrices);
      this.logger.log(`Fetched price for ${symbol}: $${price}`);
      this.storeStockPrice(symbol, price);
    } catch (error) {
      this.logger.error(
        `Error fetching stock price for ${symbol}: ${error.message}`,
      );
    }
  }

  private storeStockPrice(symbol: string, price: number) {
    if (!this.stockPrices[symbol]) {
      this.stockPrices[symbol] = [];
    }
    this.stockPrices[symbol].push(price);
    if (this.stockPrices[symbol].length > 10) {
      this.stockPrices[symbol].shift();
    }
    this.stockRepository.save({ symbol, price });
  }

  private calculateMovingAverage(symbol: string): number {
    const prices = this.stockPrices[symbol];
    if (!prices || prices.length === 0) return 0;
    const sum = prices.reduce((acc, price) => acc + price, 0);
    return sum / prices.length;
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'fetchStockPrices',
  })
  handleCron() {
    Object.keys(this.stockPrices).forEach((symbol) => {
      this.fetchStockPrice(symbol);
    });
    this.logger.debug('Called every minute to fetch stock prices');
  }

  startPeriodicCheck(symbol: string) {
    if (!this.stockPrices[symbol]) {
      this.stockPrices[symbol] = [];
    }
    this.logger.log(`Started periodic check for ${symbol}`);
  }

  async getStockInfo(symbol: string) {
    if (!this.stockPrices[symbol]) {
      this.stockPrices[symbol] = [];
    }
    const currentPrice =
      this.stockPrices[symbol]?.[this.stockPrices[symbol].length - 1] || 0;
    const movingAverage = this.calculateMovingAverage(symbol);
    return { symbol, currentPrice, movingAverage, lastUpdated: new Date() };
  }
}
