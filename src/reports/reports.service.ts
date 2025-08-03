import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Pool } from 'pg';
import QueryStream from 'pg-query-stream';
import { stringify } from 'csv-stringify';
import { pipeline } from 'stream/promises';
import * as copyStreams from 'pg-copy-streams';

const COPY_TO = copyStreams.to;

@Injectable()
export class ReportsService {
  private readonly pool: Pool;
  private readonly logger = new Logger(ReportsService.name);

  constructor() {
    this.pool = new Pool(); // auto reads env vars
  }

  /**
   * Pipes CSV to the provided response based on mode.
   */
  async pipeCsv(res: Response, mode: 'naive' | 'stream' | 'copy') {
    switch (mode) {
      case 'naive':
        return this.naiveCsv(res);
      case 'stream':
        return this.streamCsv(res);
      case 'copy':
        return this.copyCsv(res);
    }
  }

  private async naiveCsv(res: Response) {
    // WARNING: May OOM for large datasets – demonstration only
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query('SELECT id, amount, created_at FROM sales ORDER BY created_at');
      const csv = await new Promise<string>((resolve, reject) => {
        stringify(rows, { header: true }, (err, output) => (err ? reject(err) : resolve(output)));
      });
      res.send(csv);
    } finally {
      client.release();
    }
  }

  private async streamCsv(res: Response) {
    const client = await this.pool.connect();
    const batchSize = Number(process.env.BATCH_SIZE ?? 10000);
    const query = new QueryStream('SELECT id, amount, created_at FROM sales ORDER BY created_at', [], { batchSize });
    const pgStream = client.query(query);
    const csvTransform = stringify({ header: true });

    try {
      await pipeline(pgStream, csvTransform, res);
    } finally {
      client.release();
    }
  }

  private async copyCsv(res: Response) {
    const client = await this.pool.connect();
    // @ts-ignore types mismatch
    const copyStream = client.query(
      COPY_TO('COPY (SELECT id, amount, created_at FROM sales) TO STDOUT WITH CSV HEADER'),
    );
    try {
      await pipeline(copyStream, res);
    } finally {
      client.release();
    }
  }
}
