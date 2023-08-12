import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileService } from './file.service';
import { FileInCreate, PreSignedUrlDto } from './file.dto';


@Controller('file')
@ApiTags('File')
export class FileController {
    constructor(private readonly fileService: FileService ) {}

    @ApiBody({ type: FileInCreate })
    @Post('/presigned-url')
    @ApiOperation({ summary: 'Presigned Url' })
    async createPresignedUrl(@Body() fileInCreate: FileInCreate): Promise<PreSignedUrlDto> {
        return await this.fileService.createPresignedUrl(fileInCreate);
    }
}
