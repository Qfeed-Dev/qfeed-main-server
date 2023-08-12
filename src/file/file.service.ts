import { Injectable } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { FileInCreate, PreSignedUrlDto } from './file.dto';

@Injectable()
export class FileService {

    async createPresignedUrl(fileInCreate: FileInCreate): Promise<PreSignedUrlDto> {
        const s3 = new S3Client({
          region: process.env.AWS_S3_BUCKET_REGION,
          credentials: {
            accessKeyId: process.env.AWS_S3_ACCESS_KEY,
            secretAccessKey: process.env.AWS_S3_SECRET_KEY,
          },
        });
    
        const key = `files/${fileInCreate.appName}/${Date.now()}-${fileInCreate.fileName}`;
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
          ContentType: fileInCreate.fileType,
        });
    
        const presignedUrl = await getSignedUrl(s3, command, {
          expiresIn: 3600,
        });
    
        return new PreSignedUrlDto({
          presignedUrl: presignedUrl,
          imageUrl: `${process.env.AWS_S3_BUCKET_URL}/${key}`,
        })
          
      }

}
