import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, ArrayMinSize, ArrayMaxSize, ValidateIf } from 'class-validator';
import { Choice, Question, ViewHistory } from './question.entity';
import { UserDto } from 'src/account/account.dto';


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
        this.owner = new UserDto(question.owner);
        this.title = question.title;
        this.choiceList = question.choiceList;
        this.backgroundImage = question.backgroundImage;
        this.isOfficial = question.isOfficial;
        this.isBlind = question.isBlind;
        this.createdAt = question.createdAt;
        this.updatedAt = question.updatedAt;

        if (question.viewHistories) {
            this.viewHistories = question.viewHistories.map((viewHistory: ViewHistory) => new ViewHistoryDto(viewHistory));
        }
        if (question.choices) {
            this.choices = question.choices.map((choice: Choice) => new ChoiceDto(choice));
        }
    }

    @ApiProperty({example: 1})
    id: number;
    
    @ApiProperty({example: {"id": 1, "nickname": "q_feed", "profileImage": "https://~"} })
    owner: UserDto;

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

    @ApiProperty({example: [], default: []})
    viewHistories: ViewHistoryDto[];

    @ApiProperty({example: [], default: []})
    choices: ChoiceDto[];

    @ApiProperty({example: new Date()})
    createdAt: Date;

    @ApiProperty({example: new Date()})
    updatedAt: Date;

}

export class QuestionFetchDto {

    constructor(userId: number, question: Question) {
        this.id = question.id;
        this.owner = new UserDto(question.owner);
        this.title = question.title;
        this.choiceCount = question.choices.length;
        this.viewCount = question.viewHistories.length;
        this.createdAt = question.createdAt;
        this.isViewed = question.viewHistories.some((viewHistory: ViewHistory) => viewHistory.user.id === userId);
        this.isChoiced = question.choices.some((choice: Choice) => choice.user.id === userId);
    }

    @ApiProperty({example: 1})
    id: number;

    @ApiProperty({example: {"id": 1, "nickname": "q_feed", "profileImage": "https://~"} })
    owner: UserDto;

    @ApiProperty({example: '질문 제목'})
    title: string;

    @ApiProperty({example: 1})
    choiceCount: number;

    @ApiProperty({example: 1})
    viewCount: number;

    @ApiProperty({example: "fasle", default: false})
    isViewed: boolean;

    @ApiProperty({example: "fasle", default: false})
    isChoiced: boolean;

    @ApiProperty({example: new Date()})
    createdAt: Date;

}



export class QuestionsResponse {
    
    constructor( count: number, data: QuestionFetchDto[] ) {
        this.count = count;
        this.data = data;
    }

    @ApiProperty({example: 1})
    count: number;
    
    @ApiProperty({example: [QuestionFetchDto]})
    data: QuestionFetchDto[];

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
            this.value = choice.value;
            this.createdAt = choice.createdAt;
            this.updatedAt = choice.updatedAt;
            if (choice.user){
                this.user = new UserDto(choice.user);
            }
        }
    
        @ApiProperty({example: 1})
        id: number;
    
        @ApiProperty({example: {"id": 1, "nickname": "q_feed", "profileImage": "https://~"}, default: null })
        user: UserDto;
    
        @ApiProperty({example: '투표 선택지1'})
        value: string;
    
        @ApiProperty({example: new Date()})
        createdAt: Date;
    
        @ApiProperty({example: new Date()})
        updatedAt: Date;
    
}



export class ViewHistoryDto {
        
        constructor(viewHistory: ViewHistory) {
            this.id = viewHistory.id;
            this.createdAt = viewHistory.createdAt;
            this.updatedAt = viewHistory.updatedAt;

            if (viewHistory.user) {
                this.user = new UserDto(viewHistory.user);
            }
        }
    
        @ApiProperty({example: 1})
        id: number;
    
        @ApiProperty({example: {"id": 1, "nickname": "q_feed", "profileImage": "https://~"}, default: null })
        user: UserDto;
    
        @ApiProperty({example: new Date()})
        createdAt: Date;
    
        @ApiProperty({example: new Date()})
        updatedAt: Date;
}