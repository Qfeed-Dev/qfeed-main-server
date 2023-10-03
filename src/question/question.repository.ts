import { CustomRepository } from "src/db/typeorm-ex.decorator";
import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Choice, Qset, UserQset, Question, ViewHistory } from "./question.entity";
import { Between, In, Not, Repository } from "typeorm";
import { QuestionInCreate } from "./question.dto";
import { Account } from "src/account/account.entity";
import { OrderBy, Qtype } from "./question.enum";


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
            if (error.code === '23505') {
                throw new ConflictException(`already create this title in user [${QuestionInCreate.title}]`);
            }
            throw new InternalServerErrorException('create question failed');
        }
    }

    async fetchQuestionsByQuery(currentUser: Account, followingUserIds: number[] , qtype: Qtype, orderBy: OrderBy, offset: number, limit: number): Promise<[number, any]>{
        const query = this.createQueryBuilder('question')
            .select([
                'question.id as "id"',
                'question.title as "title"',
                'question.backgroundImage as "backgroundImage"',
                'question.Qtype as "Qtype"',
                'question.createdAt as "createdAt"',
                `CAST(COUNT(viewHistory.id) AS INT) as "viewCount"`,
                `CAST(COUNT(choice.id) AS INT) as "choiceCount"`,
                `CAST(MAX(CASE WHEN viewHistory.userId = ${currentUser.id} THEN 1 ELSE 0 END) AS BOOLEAN) as "isViewed"`, 
                `CAST(MAX(CASE WHEN choice.userId = ${currentUser.id} THEN 1 ELSE 0 END) AS BOOLEAN) as "isChoiced"`,
            ])
            .addSelect([
                'owner.id',
                'owner.nickname',
                'owner.profileImage',
            ])
            .leftJoin('question.viewHistories', 'viewHistory')
            .leftJoin('question.choices', 'choice')
            .leftJoin('question.owner', 'owner')
            .groupBy('question.id')
            .addGroupBy('owner.id')
            .orderBy('"isViewed"')
            .addOrderBy('"isChoiced"')
            .addOrderBy(`"${orderBy}"`, 'DESC')
            .where('question.ownerId IN (:...followingUserIds)', { followingUserIds })
            .andWhere('question.isBlind = false')
            .andWhere(`question.Qtype = '${qtype}'`)

        const questions = await query.limit(limit).offset(offset).getRawMany();
        const count = await query.getCount();
        return [count, questions]
    }



    async fetchUserQuestions(targetUserId: number, Qtype: Qtype, offset: number, limit: number): Promise<Question[]> {
        const questions = await this.find({
            relations: ['owner', 'viewHistories','viewHistories.user', 'choices', 'choices.user'],
            where: { 
                owner : { id: targetUserId },
                Qtype : Qtype,
                isBlind : false,
            },
            skip: offset,
            take: limit,
        })
        return questions
    }


    async getQuestionById(id: number): Promise<Question> {
        const question = await this.findOne({
            relations: ['owner', 'viewHistories','viewHistories.user', 'choices', 'choices.user'],
            where: { id : id }
        })
        if(question) {
            return question;
        } else {
            throw new NotFoundException(`Can't find question with id: ${id}`);
        }
    }

    async getOrCreateOfficialQ(targetUser: Account, title: string): Promise<Question> {
        const question = await this.findOne({
            where: { 
                owner : { id: targetUser.id },
                title: title, 
                Qtype: Qtype.Official, 
            }
        })
        if(question) {
            return question;
        }
        const newQuestion = this.create({
            owner: targetUser,
            title: title,
            Qtype: Qtype.Official ,
        });
        return await this.save(newQuestion);
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

    async getUserChoiceCount(user: Account, Qtype: Qtype): Promise<number> {
        return await this.count({
            where: {
                question: { 
                    Qtype: Qtype,
                    owner: { id : user.id },
                    isBlind: false,
                 },
            }
        })
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

    async fetchDoneUserQset(user: Account): Promise<UserQset[]> {
        const userQsets = await this.find({
            relations: ['Qset'],
            where: {
                user: { id: user.id },
                isDone: true,
            },
        })
        return userQsets
    }
    
    async getLastUserQset(user: Account): Promise<UserQset[]> {
        const UserQset = await this.findOne({
            relations: ['user', 'Qset'],
            where: {
                user: { id: user.id },
            },
            order: { startAt: 'DESC' },
        })
        if (UserQset) {
            return [UserQset];
        }
        return []
    }

    async getTodayUserQsets(user: Account): Promise<UserQset[]> {
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return await this.find({
            relations: ['user', 'Qset'],
            where: {
                user: { id: user.id },
                startAt: Between(today, tomorrow),
            },
            order: { startAt: 'DESC' },
        })
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

    async getUserQset(userQsetId: number): Promise<UserQset> {
        const userQset = await this.findOne({
            relations: ['user', 'Qset'],
            where: { id : userQsetId }
        })
        if(userQset) {
            return userQset;
        } else {
            throw new NotFoundException(`Can't find userQset with id: ${userQsetId}`);
        }
    }

}
