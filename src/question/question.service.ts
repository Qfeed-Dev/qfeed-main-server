import { Injectable, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; 
import { EntityManager, In } from 'typeorm';
import { ChoiceRepository, ViewHistoryRepository, QuestionRepository, QsetRepository, UserQsetRepository} from './question.repository';
import { Account, Follow } from 'src/account/account.entity';
import { Choice, UserQset, Question, ViewHistory } from './question.entity';
import { Qtype } from './question.enum';
import { ChoiceInUserQ, QuestionFetchDto, QuestionInCreate, QuestionsResponse } from './question.dto';
import { AccountRepository, FollowRepository } from 'src/account/account.repository';


@Injectable()
export class QuestionService {
    
    constructor( 
        private readonly entityManager: EntityManager,
        
        @InjectRepository(AccountRepository)
        private accountRepository: AccountRepository,

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

    async fetchFollowingQuestions(user: Account, qtype: Qtype, offset: number, limit: number): Promise<QuestionsResponse> {
        const currentUser = await this.accountRepository.findOne({
            relations: ["followings", "followings.targetUser"], 
            where: { id: user.id }
        })

        const questions = await this.questionRepository.fetchQuestions(currentUser, qtype, offset, limit);
        const count = await this.questionRepository.count({ 
            where: { 
                Qtype: qtype,
                isBlind: false,
                owner: { id: In(currentUser.followings.map( (follow: Follow) => follow.targetUser.id) ) },
            }
        });
        
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
        if (question.choiceList && !(question.choiceList.includes(value))) {
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

    async getUserChoiceCount(user: Account, Qtype: Qtype): Promise<number> {
        return await this.choiceRepository.getUserChoiceCount(user, Qtype);
    }

    async getTodayUserQset(user: Account): Promise<UserQset[]> {
        const todayUserQsets = await this.userQsetRepository.getTodayUserQsets(user);
        if (todayUserQsets.length == 0) {
            return await this.userQsetRepository.getLastUserQset(user);
        }
        return todayUserQsets;
    }


    async createUserQset(user: Account) {
        const todayUserQsets = await this.userQsetRepository.getTodayUserQsets(user);
        if (todayUserQsets.length == 2) {
            throw new BadRequestException(`already created 2 userQset today`);
        }
        if (todayUserQsets.length == 1 && !todayUserQsets[0].isDone) {
            throw new BadRequestException(`exist running userQset`);
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
            throw new ForbiddenException(`Can't pass other user's qset`);
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

    async choiceUserQ(user: Account, userQsetId: number, choiceInUserQ: ChoiceInUserQ): Promise<UserQset> {
    
        if (choiceInUserQ.targetUserId === user.id) {
            throw new BadRequestException(`Can't choice yourself`)
        }
        const CurrentUserQset = await this.userQsetRepository.getUserQset(userQsetId);
        if (CurrentUserQset.user.id !== user.id) {
            throw new ForbiddenException(`Can't choice other user's qset`);
        }
        if (CurrentUserQset.isDone) {
            throw new BadRequestException(`already done`);
        }

        const title = CurrentUserQset.Qset.QList[CurrentUserQset.cursor];
        const targetUser = await this.accountRepository.getAccountById(choiceInUserQ.targetUserId);
        let nextUserQset: UserQset;

        try{
            await this.entityManager.transaction(async transactionalEntityManager => {
                const question = await this.questionRepository.getOrCreateOfficialQ(targetUser, title);
                const choice = await this.choiceRepository.createChoice(user, question, choiceInUserQ.value);
                nextUserQset = await this.passUserQ(user, userQsetId);
                await transactionalEntityManager.save(question);
                await transactionalEntityManager.save(choice);
                await transactionalEntityManager.save(nextUserQset);
            });
        } catch (error) {
            if (error instanceof ConflictException)
                throw error;
            throw new ConflictException(`[TRANSACTION] choice failed`);
        }
        return nextUserQset;

    }        


}
