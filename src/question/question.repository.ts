import { CustomRepository } from "src/db/typeorm-ex.decorator";
import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Choice, Question } from "./question.entity";
import { Repository } from "typeorm";
import { ChoiceResponse, QuestionInCreate } from "./question.dto";
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
        const questions = await this.find({
            relations: ['owner'],
            skip: offset,
            take: limit,
            order: { createdAt: "DESC" }
        });
        return questions;
    }

    async getQuestionById(id: number): Promise<Question> {
        const question = await this.findOne({
            where: {"id": id},
            relations: ['owner']
        })
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
            throw new InternalServerErrorException('create choice failed');
        }
    }

    async fetchChoices(userId: number, questionId: number): Promise<ChoiceResponse[]> {
        const query = this.createQueryBuilder('choice')
            .select([
                'choice.value as value', 
                'COUNT(choice.id) as count', 
                `SUM(CASE WHEN choice.user.id = ${userId} THEN 1 ELSE 0 END) > 0 as "userChoice"`
            ])
            .where( { "question":  { "id": questionId }} )
            .groupBy('choice.value')

        const result = await query.getRawMany();
        return result.map((res) => new ChoiceResponse(res.value, res.count, res.userChoice));
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
