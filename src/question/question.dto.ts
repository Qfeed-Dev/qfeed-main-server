import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, ArrayMinSize, ArrayMaxSize, ValidateIf } from 'class-validator';
import { Choice, Question } from './question.entity';


export class QuestionInCreate {
    
    @ApiProperty({example: false, default: false})
    isOfficial: boolean;

    @ApiProperty({example: '질문 제목'})
    @IsNotEmpty()
    title: string;

    @ApiProperty({example: ['투표 선택지1', '투표 선택지2']})
    @ValidateIf((obj) => !obj.isOfficial)
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(6)
    choiceList: string[];

    @ApiProperty({example: 'https://qfeed-s3.s3.ap-northeast-2.amazonaws.com/files/github.png'})
    backgroundImage: URL;


    @ApiProperty({example: false, default: false})
    isBlind: boolean;

}


export class QuestionDto {
    
    constructor(question: Question) {
        this.id = question.id;
        this.ownerId = question.owner.id;
        this.title = question.title;
        this.choiceList = question.choiceList;
        this.backgroundImage = question.backgroundImage;
        this.isOfficial = question.isOfficial;
        this.isBlind = question.isBlind;
        this.createdAt = question.createdAt;
        this.updatedAt = question.updatedAt;
    }

    @ApiProperty({example: 1})
    id: number;
    
    @ApiProperty({example: 2})
    ownerId: number;

    @ApiProperty({example: '질문 제목'})
    title: string;

    @ApiProperty({example: ['투표 선택지1', '투표 선택지2']})
    choiceList: string[];

    @ApiProperty({example: 'https://qfeed-s3.s3.ap-northeast-2.amazonaws.com/files/github.png'})
    backgroundImage: URL;

    @ApiProperty({example: false, default: false})
    isOfficial: boolean;

    @ApiProperty({example: false, default: false})
    isBlind: boolean;

    @ApiProperty({example: new Date()})
    createdAt: Date;

    @ApiProperty({example: new Date()})
    updatedAt: Date;

}

export class QuestionsResponse {
    
    constructor( count: number, data: QuestionDto[] ) {
        this.count = count;
        this.data = data;
    }

    @ApiProperty({example: 1})
    count: number;
    
    @ApiProperty({example: [QuestionDto]})
    data: QuestionDto[];

}

export class QuestionDetailResponse {
    
    constructor( question: QuestionDto, choiceCount: { [key: string]: number; } ) {
        this.question = question;
        this.choiceCount = choiceCount;
    }

    question: QuestionDto;
    choiceCount : { [key: string]: number; };
    
}


export class ChoiceInCreate {

    @ApiProperty({example: '투표 선택지1'})
    @IsNotEmpty()
    value: string;

}

export class ChoiceDto {
        
        constructor(choice: Choice) {
            this.id = choice.id;
            this.questionId = choice.question.id;
            this.userId = choice.user.id;
            this.value = choice.value;
            this.createdAt = choice.createdAt;
            this.updatedAt = choice.updatedAt;
        }
    
        @ApiProperty({example: 1})
        id: number;
    
        @ApiProperty({example: 1})
        questionId: number;
    
        @ApiProperty({example: 1})
        userId: number;
    
        @ApiProperty({example: '투표 선택지1'})
        value: string;
    
        @ApiProperty({example: new Date()})
        createdAt: Date;
    
        @ApiProperty({example: new Date()})
        updatedAt: Date;
    
}

export class ChoiceResponse {
        
    constructor( value: string, count: number, userChoice: boolean ) {
        this.value = value;
        this.count = count;
        this.userChoice = userChoice;
    }

    @ApiProperty({example: '투표 선택지1'})
    value: string;

    @ApiProperty({example: 1})
    count: number;

    @ApiProperty({example: true})
    userChoice: boolean;
    

}