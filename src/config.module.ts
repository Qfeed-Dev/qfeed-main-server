// config.module.ts
import { Module } from '@nestjs/common';
import { config } from 'dotenv';

@Module({})
export class ConfigModule {
  constructor() {
    config();
  }
}