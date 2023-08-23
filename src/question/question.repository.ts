import { CustomRepository } from "src/db/typeorm-ex.decorator";
import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Choice, Qset, UserQset, Question, ViewHistory } from "./question.entity";
import { In, Not, Repository } from "typeorm";
import { QuestionInCreate } from "./question.dto";
import { Account } from "src/account/account.entity";


@CustomRepository(Question)
export class QuestionRepository extends Repository<Question> {
    
    async createQuestion(owner: Account, QuestionInCreate: QuestionInCreate): Promise<Question> {
        try {
            const question = this.create({
                ...QuestionInCreate,
                owner: owner
            });
            await this.save(question);
            return question;
        } catch (error) {
            throw new InternalServerErrorException('create question failed');
        }
    }

    async fetchQuestions(offset: number, limit: number): Promise<Question[]> {

        const query = this.createQueryBuilder('question')
            .leftJoinAndSelect(
                'question.owner',
                'owner'
            )
            .leftJoinAndSelect(
                'question.viewHistories',
                'viewHistories',
            )
            .leftJoinAndSelect(
                'viewHistories.user',
                'viewUer',
            )
            .leftJoinAndSelect(
                'question.choices',
                'choices',
            )
            .leftJoinAndSelect(
                'choices.user',
                'choiceUser',
            )
            .skip(offset)
            .take(limit)
            .orderBy('question.createdAt', 'DESC')

        const results = await query.getMany();
        return results
    }

    async getQuestionById(id: number): Promise<Question> {
        const query = this.createQueryBuilder('question')
            .leftJoinAndSelect(
                'question.owner',
                'owner'
            )
            .leftJoinAndSelect(
                'question.viewHistories',
                'viewHistories',
            )
            .leftJoinAndSelect(
                'viewHistories.user',
                'viewUer',
            )
            .leftJoinAndSelect(
                'question.choices',
                'choices',
            )
            .leftJoinAndSelect(
                'choices.user',
                'choiceUser',
            )
            .where('question.id = :id', { id })
        const question = await query.getOne();
        
        if(question) {
            return question;
        } else {
            throw new NotFoundException(`Can't find question with id: ${id}`);
        }
    }
}


@CustomRepository(Choice)
export class ChoiceRepository extends Repository<Choice> {
    async createChoice(user: Account, question: Question, value: string): Promise<Choice> {
        try {
            const choice = this.create({
                user: user, question: question, value: value,
            });
            await this.save(choice);
            return choice;
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('already create choice in question');
            }
            throw new InternalServerErrorException('create choice failed');
        }
    }

    async getChoiceById(questionId: number, id: number): Promise<Choice> {
        const choice = await this.findOne({
            where: {
                "question":  { "id": questionId },
                "id": id,
            },
        })
        if(choice) {
            return choice;
        } else {
            throw new NotFoundException(`Can't find choice with id: ${id}`);
        }
    }
}


@CustomRepository(ViewHistory)
export class ViewHistoryRepository extends Repository<ViewHistory> {

    async getOrCreateViewHistory(user: Account, question: Question): Promise<ViewHistory> {
        const viewHistory = await this.findOne({
            where: {
                user: { id: user.id },
                question: { id: question.id },
            }
        })
        if(viewHistory) {
            return viewHistory;
        } else {
            const viewHistory =  this.create({ user, question });
            return await this.save(viewHistory);

        }
    }

}


@CustomRepository(Qset)
export class QsetRepository extends Repository<Qset> {

    async getNewQset(excludedQsetIds: number[]): Promise<Qset> {
        const Qset = await this.findOne({
            where: {
                id: Not(In(excludedQsetIds)),
            },
            order: {
                id: 'ASC',
            },
        })
        if (Qset) {
            return Qset;
        }
        throw new NotFoundException(`Can't find New Qset`);
    }
}



@CustomRepository(UserQset)
export class UserQsetRepository extends Repository<UserQset> {

    async fetchBy(user: Account): Promise<UserQset[]> {
        const userQsets = await this.find({
            relations: ['Qset'],
            where: {
                user: { id: user.id },
                isDone: true,
            },
        })
        return userQsets
    }
    
    async getBy(user: Account): Promise<UserQset> {
        const UserQset = await this.findOne({
            relations: ['user', 'Qset'],
            where: {
                user: { id: user.id },
                isDone: false,
            },
        })
        if (UserQset) {
            return UserQset;
        }
        throw new NotFoundException(`Can't find running Qset`);
    }
    
    async createBy(user: Account, Qset: Qset): Promise<UserQset> {
        try {
            const useQset = this.create({
                user, Qset
            });
            return await this.save(useQset);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('already create useQset in Qset');
            }
            throw new InternalServerErrorException('create useQset failed');
        }
    }

}
