import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChoiceRepository, ViewHistoryRepository, QuestionRepository, QsetRepository, UserQsetRepository} from './question.repository';
import { Account } from 'src/account/account.entity';
import { Choice, UserQset, Question, ViewHistory } from './question.entity';
import { QuestionFetchDto, QuestionInCreate, QuestionsResponse } from './question.dto';
import { Qtype } from './question.enum';


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
        const count = await this.questionRepository.count();
        
        return new QuestionsResponse(
            count, questions.map((question: Question) => new QuestionFetchDto(user.id, question))
        );
    }

    async fetchUserQuestions(
        currentUserId:number,
        targetUserId: number,
        Qtype: Qtype,
        offset: number,
        limit: number
    ): Promise<QuestionsResponse> {
        const questions = await this.questionRepository.fetchUserQuestions(targetUserId, Qtype, offset, limit);
        const count = await this.questionRepository.count({ where: { owner: {id: targetUserId} }});
        return new QuestionsResponse(
            count, questions.map((question: Question) => new QuestionFetchDto(currentUserId, question))
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

    async getTodayUserQset(user: Account): Promise<UserQset[]> {
        const todayUserQsets = await this.userQsetRepository.getTodayUserQsets(user);
        if (todayUserQsets.length == 0) {
            const lastUserQset = await this.userQsetRepository.getLastUserQset(user);
            return [lastUserQset];
        }
        return todayUserQsets;
    }

    async createUserQset(user: Account) {
        // TODO: transaction 으로 묶기 or outer join with history 고려
        const todayUserQsets = await this.userQsetRepository.getTodayUserQsets(user);
        if (todayUserQsets.length == 2) {
            throw new BadRequestException(`already created 2 userQset today`);
        }
        if (todayUserQsets.length == 1 && !todayUserQsets[0].isDone) {
            throw new BadRequestException(`exist not done userQset`);
        }
        const userQsetList = await this.userQsetRepository.fetchDoneUserQset(user);
        const excludedQsetIds = userQsetList.map((userQset: UserQset) => userQset.Qset.id);
        const newQset = await this.QsetRepository.getNewQset(excludedQsetIds);
        const userQset = await this.userQsetRepository.createBy(user, newQset);
        return userQset;
    }

    async passUserQ(user: Account, userQsetId: number): Promise<UserQset> {
        const CurrentUserQset = await this.userQsetRepository.getUserQset(userQsetId);
        if (CurrentUserQset.user.id !== user.id) {
            throw new BadRequestException(`Can't pass other user's qset`);
        }
        if (CurrentUserQset.isDone) {
            throw new BadRequestException(`already done`);
        }
        if (++CurrentUserQset.cursor == CurrentUserQset.Qset.QList.length) {
            CurrentUserQset.isDone = true;
            CurrentUserQset.endAt = new Date();
        }
        return await this.userQsetRepository.save(CurrentUserQset);
        
    }

}
