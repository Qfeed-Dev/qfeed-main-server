import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';


export class FileInCreate {

    @ApiProperty({example: 'account'})
    @IsNotEmpty()
    readonly appName: string;

    @ApiProperty({example: 'github.png'})
    @IsNotEmpty()
    readonly fileName: string;

    @ApiProperty({example: 'image/png'})
    @IsNotEmpty()
    readonly fileType: string;
}

export class PreSignedUrlDto {

    constructor(partial: Partial<PreSignedUrlDto>) {
        Object.assign(this, partial);
    }

    @ApiProperty({example: 'https://qfeed-s3.s3.ap-northeast-2.amazonaws.com/account/github.png?AWSAccessKeyId=AKIAJ'})
    readonly presignedUrl: string;

    @ApiProperty({example: 'https://qfeed-s3.s3.ap-northeast-2.amazonaws.com/account/1623778080000-github.png'})
    readonly imageUrl: string;

}