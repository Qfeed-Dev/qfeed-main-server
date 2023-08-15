import { ApiProperty } from '@nestjs/swagger';
import { Length, IsNotEmpty, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Question } from './question.entity';


export class QuestionInCreate {

    @ApiProperty({example: '질문 제목'})
    @IsNotEmpty()
    title: string;

    @ApiProperty({example: ['투표 선택지1', '투표 선택지2']})
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(6)
    choiceList: string[];

    @ApiProperty({example: 'https://qfeed-s3.s3.ap-northeast-2.amazonaws.com/files/github.png'})
    backgroundImage: URL;

    @ApiProperty({example: false, default: false})
    isOfficial: boolean;

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
            this.createdAt = question.created_at;
            this.updatedAt = question.updated_at;
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