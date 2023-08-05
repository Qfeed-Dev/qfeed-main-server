import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import { SchoolType, Gender } from "./account.enum";


@Entity()
@Unique(['email', 'socialId'])
export class Account extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique:true, nullable: true })
    socialId: string;

    @Column({ unique:true, nullable: true })
    email: string;

    @Column({ nullable: true })
    password: string;

    @Column({ nullable: true })
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

}