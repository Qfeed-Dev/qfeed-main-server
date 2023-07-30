import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AccountInSignUp {

    @ApiProperty({example: 'qfeed@qfeed.site'})
    @IsEmail()
    readonly email: string;

    @ApiProperty({example: 'password'})
    @IsNotEmpty()
    readonly password: string;
    
}

export class AccountInSignIn {
    
    @ApiProperty({example: 'qfeed@qfeed.site'})
    @IsEmail()
    readonly email: string;

    @ApiProperty({example: 'password'})
    @IsNotEmpty()
    readonly password: string;
}

export class AccountDto {
    constructor(id: number, email: string) {
        this.id = id;
        this.email = email;
    }
    
    @ApiProperty({example: 1})
    id: number;
    
    @ApiProperty({example: "qfeed@qfeed.site"})
    email?: string;

}

export class TokenDto {
    constructor(token: string, expireTime: Date) {
        this.accessToken = token;
        this.expireTime = expireTime;
    }

    @ApiProperty({example: "TOKEN"})
    accessToken: string;

    @ApiProperty({example: "2023-06-12T15:29:37.039Z"})
    expireTime: Date;
}