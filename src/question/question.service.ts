import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChoiceRepository, QuestionHistoryRepository, QuestionRepository } from './question.repository';
import { Account } from 'src/account/account.entity';
import { Choice, Question, QuestionHistory } from './question.entity';
import { ChoiceResponse, QuestionDto, QuestionInCreate, QuestionsResponse } from './question.dto';
import { In } from 'typeorm';


@Injectable()
export class QuestionService {
    
    constructor( 
        @InjectRepository(QuestionRepository)
        private questionRepository: QuestionRepository,
        
        @InjectRepository(ChoiceRepository)
        private choiceRepository: ChoiceRepository,

        @InjectRepository(QuestionHistoryRepository)
        private questionHistoryRepository: QuestionHistoryRepository,

    ) {}
    
    async createQuestion(user: Account, QuestionInCreate: QuestionInCreate): Promise<Question> {
        return await this.questionRepository.createQuestion(user, QuestionInCreate);
    }

    async fetchQuestions(user: Account, offset: number, limit: number): Promise<QuestionsResponse> {
        const questions = await this.questionRepository.fetchQuestions(user, offset, limit);
        const count = await this.questionRepository.count();
        
        return new QuestionsResponse(
            count,
            questions.map((question: Question) => new QuestionDto(question))
        );
    }

    async getQuestionById(id: number): Promise<Question> {
        const question = await this.questionRepository.getQuestionById(id);
        return question;
    }

    async createChoice(user: Account, questionId: number, value: string): Promise<Choice> {
        const question = await this.questionRepository.getQuestionById(questionId);
        return this.choiceRepository.createChoice(user, question, value);
    }

    async fetchChoices(userId: number, questionId: number): Promise<ChoiceResponse[]> {
        return await this.choiceRepository.fetchChoices(userId, questionId);
    }

    async getChoiceById(questionId: number, id: number): Promise<Choice> {
        return await this.choiceRepository.getChoiceById(questionId, id);
    }

    async getOrCreateHistory(user: Account, question: Question): Promise<QuestionHistory> {
        const history = await this.questionHistoryRepository.getOrCreateHistory(user, question);
        return history;
    }


}
