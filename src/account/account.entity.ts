import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, Unique, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from "typeorm";
import { SchoolType, Gender } from "./account.enum";
import { Question } from "src/question/question.entity";


export class TimeEntity extends BaseEntity {
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity()
@Unique(['email', 'socialId'])
export class Account extends TimeEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique:true, nullable: true })
    socialId: string;

    @Column({ unique:true, nullable: true })
    email: string;

    @Column({ nullable: true })
    password: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ unique:true, nullable: true })
    nickname: string;

    @Column({ nullable: true })
    schoolType: SchoolType;

    @Column({ nullable: true })
    schoolName: string;

    @Column({ nullable: true })
    grade: string;

    @Column({ nullable: true })
    class: string;

    @Column({ nullable: true })
    gender: Gender;

    @Column({ nullable: true })
    birthday: Date;

    @Column({type: 'varchar', nullable: true })
    profileImage: URL;

    @Column({type: 'varchar', nullable: true })
    idCardImage: URL;

    @OneToMany(() => Question, (question) => question.owner)
    questions: Question[]

    @OneToMany(() => Follow, (follow) => follow.user)
    followings: Follow[]

    @OneToMany(() => Follow, (follow) => follow.targetUser)
    followers: Follow[]

}


@Entity()
@Unique(['user', 'targetUser'])
export class Follow extends TimeEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Account, (user) => user.followings)
    user: Account;

    @ManyToOne(() => Account, (user) => user.followers)
    targetUser: Account;

}
