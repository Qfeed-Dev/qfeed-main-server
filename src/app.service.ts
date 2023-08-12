import { Injectable } from '@nestjs/common';


@Injectable()
export class AppService {

  ping(): { [key: string]: string } {
    return { 'message' : 'pong' };
  }
    
}