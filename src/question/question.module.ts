import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { TypeOrmExModule } from 'src/db/typeorm-ex.module';
import { ChoiceRepository, QuestionRepository } from './question.repository';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([QuestionRepository, ChoiceRepository]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService]
})
export class QuestionModule {}
