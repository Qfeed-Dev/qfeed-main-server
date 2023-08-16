import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChoiceRepository, QuestionRepository } from './question.repository';
import { Account } from 'src/account/account.entity';
import { Choice, Question } from './question.entity';
import { ChoiceResponse, QuestionDto, QuestionInCreate, QuestionsResponse } from './question.dto';


@Injectable()
export class QuestionService {
    
    constructor( 
        @InjectRepository(QuestionRepository)
        private questionRepository: QuestionRepository,
        
        @InjectRepository(ChoiceRepository)
        private choiceRepository: ChoiceRepository,
    ) {}
    
    async createQuestion(user: Account, QuestionInCreate: QuestionInCreate): Promise<Question> {
        return this.questionRepository.createQuestion(user, QuestionInCreate);
    }

    async fetchQuestions(offset: number, limit: number): Promise<QuestionsResponse> {
        const questions = await this.questionRepository.fetchQuestions(offset, limit);
        const count = await this.questionRepository.count();

        return new QuestionsResponse(
            count,
            questions.map((question: Question) => new QuestionDto(question))
        );
    }

    async getQuestionById(id: number): Promise<Question> {
        const question = this.questionRepository.getQuestionById(id);
        return question;
    }

    async createChoice(user: Account, questionId: number, value: string): Promise<Choice> {
        const question = await this.questionRepository.getQuestionById(questionId);
        return this.choiceRepository.createChoice(user, question, value);
    }

    async fetchChoices(userId: number, questionId: number): Promise<ChoiceResponse[]> {
        return this.choiceRepository.fetchChoices(userId, questionId);
    }

    async getChoiceById(questionId: number, id: number): Promise<Choice> {
        return this.choiceRepository.getChoiceById(questionId, id);
    }

}
