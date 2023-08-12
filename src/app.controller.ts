import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBody } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/ping')
  ping(): { [key: string]: string } {
    return this.appService.ping();
  }

  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        appName: { type: 'string' },
        fileName: { type: 'string' },
        fileType: { type: 'string' }
      }
    }
  })
  @Post('file/presigned-url')
  async createPresignedUrl(
    @Body('appName') appName: string,
    @Body('fileName') fileName: string, 
    @Body('fileType') fileType: string
  ) {
    return await this.appService.createPresignedUrl(appName, fileName, fileType);
  }
}
