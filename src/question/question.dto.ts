import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, ArrayMinSize, ArrayMaxSize, ValidateIf, IsEnum, IsString } from 'class-validator';
import { Choice, Question, UserQset, ViewHistory } from './question.entity';
import { UserDto, UserFetchDto } from 'src/account/account.dto';
import { Qtype } from './question.enum';


export class QuestionInCreate {
    
    @ApiProperty({example: 'personal'})
    @IsNotEmpty()
    @IsEnum(Qtype)
    Qtype: Qtype;

    @ApiProperty({example: '질문 제목'})
    @IsNotEmpty()
    title: string;

    @ApiProperty({example: ['투표 선택지1', '투표 선택지2']})
    @ValidateIf((obj) => obj.Qtype == Qtype.Personal)
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(6)
    choiceList: string[];

    @ApiProperty({example: 'https://qfeed-s3.s3.ap-northeast-2.amazonaws.com/files/github.png'})
    backgroundImage: URL;


    @ApiProperty({example: false, default: false})
    isBlind: boolean;

}


export class ChoiceInCreate {

    @ApiProperty({example: '투표 선택지1'})
    @IsNotEmpty()
    value: string;

}

export class ChoiceInUserQ {
    
    @ApiProperty({example: 1})
    @IsNotEmpty()
    targetUserId: number;

    @ApiProperty({example: '투표한 친구에게 한마디 작성하세요'})
    @IsNotEmpty()
    value: string;
    
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

    @ApiProperty({ type: Number })
    id: number;

    @ApiProperty({ type: UserDto })
    user: UserDto;

    @ApiProperty({ type: Date })
    createdAt: Date;

    @ApiProperty({ type: Date })
    updatedAt: Date;
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

    @ApiProperty({ type: Number })
    id: number;

    @ApiProperty({ type: UserDto })
    user: UserDto;

    @ApiProperty({ type: String })
    value: string;

    @ApiProperty({ type: Date })
    createdAt: Date;

    @ApiProperty({ type: Date })
    updatedAt: Date;

}

export class ChoiceCountResponse {

    constructor(Qtype: Qtype, count: number) {
        this.Qtype = Qtype;
        this.count = count;
    }

    @ApiProperty({ type: String })
    Qtype: Qtype;

    @ApiProperty({ type: Number })
    count: number;
}


export class QuestionDto {
    
    constructor(question: Question) {
        this.id = question.id;
        this.owner = new UserDto(question.owner);
        this.title = question.title;
        this.choiceList = question.choiceList;
        this.backgroundImage = question.backgroundImage;
        this.Qtype = question.Qtype;
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

    @ApiProperty({ type: Number })
    id: number;
    
    @ApiProperty({type: UserDto})
    owner: UserDto;

    @ApiProperty({ type: String })
    title: string;

    @ApiProperty({type: [String]})
    choiceList: string[];

    @ApiProperty({ type: String })
    backgroundImage: URL;

    @ApiProperty({ type: String })
    Qtype: string

    @ApiProperty({ type: Boolean })
    isBlind: boolean;

    @ApiProperty({ type: [ViewHistoryDto] })
    viewHistories: ViewHistoryDto[];

    @ApiProperty({ type: [ChoiceDto] })
    choices: ChoiceDto[];

    @ApiProperty({ type: Date })
    createdAt: Date;

    @ApiProperty({ type: Date })
    updatedAt: Date;

}

export class QuestionFetchDto {

    constructor(userId: number, question: Question) {
        this.id = question.id;
        this.owner = new UserDto(question.owner);
        this.title = question.title;
        this.Qtype = question.Qtype;
        this.backgroundImage = question.backgroundImage;
        this.choiceCount = question.choices.length;
        this.viewCount = question.viewHistories.length;
        this.createdAt = question.createdAt;
        this.isViewed = question.viewHistories.some((viewHistory: ViewHistory) => viewHistory.user.id === userId);
        this.isChoiced = question.choices.some((choice: Choice) => choice.user.id === userId);
    }

    @ApiProperty({ type: Number })
    id: number;

    @ApiProperty({ type: UserDto })
    owner: UserDto;

    @ApiProperty({ type: String })
    title: string;

    @ApiProperty({ type: String })
    Qtype: string;

    @ApiProperty({ type: String })
    backgroundImage: URL;

    @ApiProperty({ type: Number })
    choiceCount: number;

    @ApiProperty({ type: Number })
    viewCount: number;

    @ApiProperty({ type: Boolean })
    isViewed: boolean;

    @ApiProperty({ type: Boolean })
    isChoiced: boolean;

    @ApiProperty({ type: Date })
    createdAt: Date;

}


export class QuestionsResponse {
    
    constructor( count: number, data: QuestionFetchDto[] ) {
        this.count = count;
        this.data = data;
    }

    @ApiProperty({type: Number})
    count: number;
    
    @ApiProperty({type: [QuestionFetchDto]})
    data: QuestionFetchDto[];

}


export class QuestionFetchByQueryDto {

    constructor(data: any) {
        this.id = data.id;
        this.owner = new UserFetchDto(data.owner_id, data.owner_nickname, data.owner_profileImage);
        this.title = data.title;
        this.Qtype = data.Qtype;
        this.backgroundImage = data.backgroundImage;
        this.choiceCount = data.choiceCount;
        this.viewCount = data.viewCount;
        this.isViewed = data.isViewed;
        this.isChoiced = data.isChoiced;
        this.createdAt = data.createdAt;
    }

    @ApiProperty({ type: Number })
    id: number;

    @ApiProperty({ type: UserFetchDto })
    owner: UserFetchDto;

    @ApiProperty({ type: String })
    title: string;

    @ApiProperty({ type: String })
    Qtype: string;

    @ApiProperty({ type: String })
    backgroundImage: URL;

    @ApiProperty({ type: Number })
    choiceCount: number;

    @ApiProperty({ type: Number })
    viewCount: number;

    @ApiProperty({ type: Boolean })
    isViewed: boolean;

    @ApiProperty({ type: Boolean })
    isChoiced: boolean;

    @ApiProperty({ type: Date })
    createdAt: Date;

}

export class QuestionFetchByQueryResponse {
        
        constructor(count:number, data:QuestionFetchByQueryDto[]) {
            this.count = count;
            this.data = data
        }
    
        @ApiProperty({type: Number})
        count: number;
        
        @ApiProperty({type: [QuestionFetchByQueryDto]})
        data: QuestionFetchByQueryDto[];

}


export class UserQsetDto {

    constructor(userQset: UserQset) {
        this.id = userQset.id;
        this.user = new UserDto(userQset.user);
        this.currentQ = userQset.Qset.QList[userQset.cursor];
        this.cursor = userQset.cursor + 1;
        this.QsetLength = userQset.Qset.QList.length;
        this.isDone = userQset.isDone;
        this.startAt = userQset.startAt;
        this.endAt = userQset.endAt;
    }

    @ApiProperty({ type: Number })
    id: number;

    @ApiProperty({ type: UserDto })
    user: UserDto;

    @ApiProperty({ type: String })
    currentQ: string;

    @ApiProperty({ type: Number })
    cursor: number;

    @ApiProperty({ type: Number })
    QsetLength: number;

    @ApiProperty({ type: Boolean })
    isDone: boolean;

    @ApiProperty({ type: Date })
    startAt: Date;

    @ApiProperty({ type: Date })
    endAt: Date;

}

