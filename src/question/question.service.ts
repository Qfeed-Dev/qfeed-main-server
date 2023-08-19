import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChoiceRepository, ViewHistoryRepository, QuestionRepository } from './question.repository';
import { Account } from 'src/account/account.entity';
import { Choice, Question, ViewHistory } from './question.entity';
import { QuestionFetchDto, QuestionInCreate, QuestionsResponse } from './question.dto';


@Injectable()
export class QuestionService {
    
    constructor( 
        @InjectRepository(QuestionRepository)
        private questionRepository: QuestionRepository,
        
        @InjectRepository(ChoiceRepository)
        private choiceRepository: ChoiceRepository,

        @InjectRepository(ViewHistoryRepository)
        private questionHistoryRepository: ViewHistoryRepository,

    ) {}
    
    async createQuestion(user: Account, QuestionInCreate: QuestionInCreate): Promise<Question> {
        return await this.questionRepository.createQuestion(user, QuestionInCreate);
    }

    async fetchQuestions(user: Account, offset: number, limit: number): Promise<QuestionsResponse> {
        const questions = await this.questionRepository.fetchQuestions(offset, limit);
        const count = await this.questionRepository.count();
        
        return new QuestionsResponse(
            count,
            questions.map((question: Question) => new QuestionFetchDto(user.id, question))
        );
    }

    async getQuestionById(id: number): Promise<Question> {
        const question = await this.questionRepository.getQuestionById(id);
        return question;
    }

    async createChoice(user: Account, questionId: number, value: string): Promise<Choice> {
        const question = await this.questionRepository.getQuestionById(questionId);
        
        const choice = this.choiceRepository.createChoice(user, question, value);
        return choice;
    }


    async getChoiceById(questionId: number, id: number): Promise<Choice> {
        return await this.choiceRepository.getChoiceById(questionId, id);
    }

    async getOrCreateViewHistory(user: Account, question: Question): Promise<ViewHistory> {
        const viewHistory = await this.questionHistoryRepository.getOrCreateViewHistory(user, question);
        return viewHistory;
    }


}
