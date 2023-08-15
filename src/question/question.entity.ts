

import { Account } from "src/account/account.entity";
import { 
    BaseEntity, 
    Column, 
    Entity, 
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
 } from "typeorm";


export class TimeEntity extends BaseEntity {
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}


@Entity()
export class Question extends TimeEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Account, (owner) => owner.questions)
    owner: Account

    @Column()
    title: string;

    @Column("simple-array")
    choiceList: string[];

    @Column({type: 'varchar', default: 'https://qfeed-s3.s3.ap-northeast-2.amazonaws.com/files/background.jpg'})
    backgroundImage: URL;

    @Column({ default: false })
    isOfficial: boolean;

    @Column({ default: false })
    isBlind: boolean;

}


export class Choice extends TimeEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Question, (question) => question.id)
    question: Question

    @ManyToOne(() => Account, (user) => user.id)
    user: Account

    @Column()
    value: string;

}