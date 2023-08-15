import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Account } from "./account.entity";

export const CurrentUser = createParamDecorator((data, ctx: ExecutionContext): Account => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
})