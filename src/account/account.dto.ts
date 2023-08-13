import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUrl, IsDateString, IsEnum, IsOptional, Matches, Length, IsNumberString } from 'class-validator';
import { Gender, SchoolType } from './account.enum';
import { Account } from './account.entity';

export class AccountInSign {

    @ApiProperty({example: 'qfeed@qfeed.site'})
    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @ApiProperty({example: 'password'})
    @IsNotEmpty()
    readonly password: string;
    
}


export class AccountInUpdate {

    @IsOptional()
    @ApiProperty({example: '김피드'})
    @IsNotEmpty()
    readonly name: string;

    @IsOptional()
    @ApiProperty({example: '01011112222'})
    @Length(11, 11)
    @IsNumberString()
    @IsNotEmpty()
    readonly phone: string;
    
    @IsOptional()
    @ApiProperty({example: 'ilikeqfeed'})
    @Matches(/^[\w\d_]+$/)
    @Length(4, 12)
    @IsNotEmpty()
    readonly nickname: string; 
    
    @IsOptional()
    @ApiProperty({example: '대학생'})
    @IsEnum(SchoolType)
    @IsNotEmpty()
    readonly schoolType: SchoolType

    @IsOptional()
    @ApiProperty({example: '큐피대학교'})
    @IsNotEmpty()
    readonly schoolName: string;

    @IsOptional()
    @ApiProperty({example: '20학번'})
    @IsNotEmpty()
    readonly grade: string; // 20학번 or 1학년

    @IsOptional()
    @ApiProperty({example: '컴퓨터공학과'})
    @IsNotEmpty()
    readonly class: string; // 컴퓨터공학과 or 1반

    @IsOptional()
    @ApiProperty({example: '남'})
    @IsEnum(Gender)
    @IsNotEmpty()
    readonly gender: Gender;

    @IsOptional()
    @ApiProperty({example: '2000-01-01'})
    @IsDateString()
    @IsNotEmpty()
    readonly birthday: Date;

    @IsOptional()
    @ApiProperty({example: 'https://blog.kakaocdn.net/dn/KdDOI/btrmGgNlqab/qlMwwXNvHSbjN0kFeIoVuK/img.jpg'})
    @IsUrl()
    readonly profileImage: URL;

    @IsOptional()
    @ApiProperty({example: 'https://m.pointcm.co.kr/web/product/medium/202201/748503d29ad558bef05878a7c3e7e987.jpg'})
    @IsUrl()
    readonly idCardImage: URL;

}





export class checkNickname{

    constructor(nickname: string, available: boolean, message: string) {
        this.nickname = nickname;
        this.available = available;
        this.message = message;
    }

    @ApiProperty({example: 'like_qfeed'})
    nickname: string;

    @ApiProperty({example: true})
    available: boolean;

    @ApiProperty({example: '사용 가능한 닉네임 입니다.'})
    message: string;
}

export class AccountDto {
    constructor(account: Account) {
        this.id = account.id;
        this.email = account.email;
        this.name = account.name;
        this.phone = account.phone;
        this.nickname = account.nickname;
        this.schoolType = account.schoolType;
        this.schoolName = account.schoolName;
        this.grade = account.grade;
        this.class = account.class;
        this.gender =account.gender;
        this.birthday = account.birthday;
        this.profileImage = account.profileImage;
        this.idCardImage = account.idCardImage; 
    }
    
    @ApiProperty({example: 1})
    id: number;
    
    @ApiProperty({example: "qfeed@qfeed.site"})
    email: string;

    @ApiProperty({example: "김피드"})
    name: string;

    @ApiProperty({example: "01011112222"})
    phone: string;

    @ApiProperty()
    nickname: string; // 영어, 숫자, _

    @ApiProperty({example: "대학생"})
    schoolType: SchoolType

    @ApiProperty({example: "큐피대학교"})
    schoolName: string;

    @ApiProperty({example: "20학번"})
    grade: string; // 20학번 or 1학년

    @ApiProperty({example: "컴퓨터공학과"})
    class: string; // 컴퓨터공학과 or 1반

    @ApiProperty({example: "남"})
    gender: Gender

    @ApiProperty({example: "2000-01-01"})
    birthday: Date;

    @ApiProperty({example: ""})
    profileImage: URL;

    @ApiProperty({example: ""})
    idCardImage: URL;

}

export class AccountsResponse {
    constructor(data: AccountDto[], count: number) {
        this.count = count;
        this.data = data;
    }

    @ApiProperty({example: 20})
    count: number;

    @ApiProperty()
    data: AccountDto[];

    
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