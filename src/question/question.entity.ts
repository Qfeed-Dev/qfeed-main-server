import { Account } from "src/account/account.entity";
import { 
    BaseEntity, 
    Column, 
    Entity, 
    Unique,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
 } from "typeorm";
import { Qtype } from "./question.enum";


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

    @ManyToOne(() => Account, (owner) => owner.questions, { onDelete: 'CASCADE' })
    owner: Account

    @Column()
    title: string;

    @Column({type: 'varchar', array: true, nullable: true})
    choiceList: string[];

    @Column({type: 'varchar', default: 'https://qfeed-s3.s3.ap-northeast-2.amazonaws.com/files/background.jpg'})
    backgroundImage: URL;

    @Column({ default: Qtype.Personal })
    Qtype: Qtype;

    @Column({ default: false })
    isBlind: boolean;

    @Column({ default: false })
    isDeleted: boolean;

    @OneToMany(() => Choice, (choice) => choice.question)
    choices: Choice[]

    @OneToMany(() => ViewHistory, (viewHistory) => viewHistory.question)
    viewHistories: ViewHistory[]

}

@Entity()
@Unique(['question', 'user']) 
export class Choice extends TimeEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Question, (question) => question.choices, { onDelete: 'CASCADE' })
    question: Question

    @ManyToOne(() => Account, (user) => user.id, { onDelete: 'CASCADE' })
    user: Account

    @Column()
    value: string;

}


@Entity()
@Unique(['question', 'user']) 
export class ViewHistory extends TimeEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Question, (question) => question.viewHistories, { onDelete: 'CASCADE' })
    question: Question

    @ManyToOne(() => Account, (user) => user.id, { onDelete: 'CASCADE' })
    user: Account

}

@Entity()
export class Qset extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', array: true })
    QList: string[];

}

@Entity()
@Unique(['Qset', 'user'])
export class UserQset extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Qset, (Qset) => Qset.id, { onDelete: 'CASCADE' })
    Qset: Qset

    @ManyToOne(() => Account, (user) => user.id, { onDelete: 'CASCADE' })
    user: Account

    @Column()
    cursor: number = 0;

    @Column()
    isDone: boolean = false;

    @Column()
    startAt: Date = new Date();

    @Column({ nullable: true })
    endAt: Date;
}

