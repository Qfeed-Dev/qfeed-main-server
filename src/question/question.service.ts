import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChoiceRepository, ViewHistoryRepository, QuestionRepository, QsetRepository, UserQsetRepository} from './question.repository';
import { Account } from 'src/account/account.entity';
import { Choice, UserQset, Question, ViewHistory } from './question.entity';
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

        @InjectRepository(QsetRepository)
        private QsetRepository: QsetRepository,

        @InjectRepository(UserQsetRepository)
        private userQsetRepository: UserQsetRepository,


    ) {}
    
    async createQuestion(user: Account, QuestionInCreate: QuestionInCreate): Promise<Question> {
        return await this.questionRepository.createQuestion(user, QuestionInCreate);
    }

    async fetchQuestions(user: Account, offset: number, limit: number): Promise<QuestionsResponse> {
        const questions = await this.questionRepository.fetchQuestions(offset, limit);
        const count = await this.questionRepository.count({ take: limit, skip: offset});
        
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
        if (question.owner.id === user.id) {
            throw new BadRequestException(`Can't choice your question`)
        }
        if (question.choiceList && !(value in question.choiceList)) {
            throw new BadRequestException(`choice value is not in ${question.choiceList}`)
        }
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


    async getCurrentUserQset(user: Account): Promise<UserQset> {
        const userQset = await this.userQsetRepository.getBy(user);
        return userQset;
    }


    async createUserQset(user: Account) {
        // TODO: transaction 으로 묶기 or outer join with history 고려
        const userQsetList = await this.userQsetRepository.fetchBy(user);
        const excludedQsetIds = userQsetList.map((userQset: UserQset) => userQset.Qset.id);
        const newQset = await this.QsetRepository.getNewQset(excludedQsetIds);
        const userQset = await this.userQsetRepository.createBy(user, newQset);
        return userQset;
    }

    async passUseQ(user: Account): Promise<UserQset> {
        const CurrentUserQset = await this.userQsetRepository.getBy(user);
        if (++CurrentUserQset.cursor == CurrentUserQset.Qset.QList.length) {
            CurrentUserQset.isDone = true;
            CurrentUserQset.endAt = new Date();
        }
        return await this.userQsetRepository.save(CurrentUserQset);
        
    }

}
