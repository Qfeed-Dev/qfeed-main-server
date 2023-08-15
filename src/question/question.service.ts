import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionRepository } from './question.repository';
import { Account } from 'src/account/account.entity';
import { Question } from './question.entity';
import { QuestionDto, QuestionInCreate, QuestionsResponse } from './question.dto';


@Injectable()
export class QuestionService {
    
    constructor( 
        @InjectRepository(QuestionRepository)
        private questionRepository: QuestionRepository
    ) {}
    
    async create(user: Account, QuestionInCreate: QuestionInCreate): Promise<Question> {
        return this.questionRepository.createQuestion(user, QuestionInCreate);
    }

    async fetch(offset: number, limit: number): Promise<QuestionsResponse> {
        const questions = await this.questionRepository.fetchQuestions(offset, limit);
        const count = await this.questionRepository.count();

        return new QuestionsResponse(
            count,
            questions.map((question: Question) => new QuestionDto(question))
        );
    }

    async getQuestionById(id: number): Promise<Question> {
        return this.questionRepository.getQuestionById(id);
    }


}
