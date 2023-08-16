import { Account } from "src/account/account.entity";
import { 
    BaseEntity, 
    Column, 
    Entity, 
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
 } from "typeorm";


export class TimeEntity extends BaseEntity {
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
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

    @OneToMany(() => Choice, (choice) => choice.question)
    choices: Choice[]

}

@Entity()
export class Choice extends TimeEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Question, (question) => question.choices)
    question: Question

    @ManyToOne(() => Account, (user) => user.id)
    user: Account

    @Column()
    value: string;

}