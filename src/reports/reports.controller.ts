import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('csv')
  async getCsv(
    @Query('mode') mode: 'naive' | 'stream' | 'copy' = 'stream',
    @Res() res: Response,
  ) {
    if (!['naive', 'stream', 'copy'].includes(mode)) {
      throw new BadRequestException('mode must be naive | stream | copy');
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales_${mode}.csv"`);
    await this.reportsService.pipeCsv(res, mode);
  }
}
