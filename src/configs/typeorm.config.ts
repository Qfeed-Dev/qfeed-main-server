import { TypeOrmModuleOptions } from "@nestjs/typeorm";


export const TypeORMConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password',
    database: 'qfeed_dev',
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: true
}