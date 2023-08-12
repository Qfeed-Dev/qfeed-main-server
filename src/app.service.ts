import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


@Injectable()
export class AppService {

  ping(): { [key: string]: string } {
    return { 'message' : 'pong' };
  }

  async createPresignedUrl(appName: string, filename: string, filetype: string): Promise<{ preSignedUrl: string; imageUrl: string }> {
    const s3 = new S3Client({
      region: process.env.AWS_S3_BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY,
      },
    });

    const key = `files/${appName}/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: filetype,
    });

    const preSignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });

    return {
      preSignedUrl: preSignedUrl,
      imageUrl: `${process.env.AWS_S3_BUCKET_URL}/${key}`,
    };
  }

    
}