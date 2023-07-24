import { TypeOrmModuleOptions } from "@nestjs/typeorm";


export const TypeORMConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false, // Use SSL/TLS for the connection
    extra: {
        ssl: {
        rejectUnauthorized: false, // Set this to true if you have the proper CA certificate.
        // If you have the CA certificate, provide it as a buffer:
        // ca: fs.readFileSync('path_to_your_ca_file.pem').toString(),
        },
    },
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: true // TODO: 추후 env 로 관리
}

