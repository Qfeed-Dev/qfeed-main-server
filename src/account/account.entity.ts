import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";


@Entity()
@Unique(['email', 'socialId'])
export class Account extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    socialId: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    password: string;
}