import { Controller, Get, Param, Put } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get(':symbol')
  async getStockInfo(@Param('symbol') symbol: string) {
    return this.stockService.getStockInfo(symbol);
  }

  @Put(':symbol')
  startPeriodicCheck(@Param('symbol') symbol: string) {
    this.stockService.startPeriodicCheck(symbol);
    return { message: `Started periodic checks for ${symbol}` };
  }
}
