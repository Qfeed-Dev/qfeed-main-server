import { CustomRepository } from "src/db/typeorm-ex.decorator";
import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Question } from "./question.entity";
import { Repository } from "typeorm";
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
        const questions = await this.find({
            relations: ['owner'],
            skip: offset,
            take: limit,
            order: { created_at: "DESC" }
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
