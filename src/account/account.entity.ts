import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";


@Entity()
@Unique(['email'])
export class Account extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    password: string;
}