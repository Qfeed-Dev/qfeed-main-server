import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountModule } from './account/account.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeORMConfig } from './db/typeorm.config';
import { FileModule } from './file/file.module';
import { QuestionModule } from './question/question.module';
import { ChatroomModule } from './chatroom/chatroom.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(TypeORMConfig),
    AccountModule,
    FileModule,
    QuestionModule,
    ChatroomModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
