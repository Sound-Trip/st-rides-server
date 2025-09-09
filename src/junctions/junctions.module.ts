import { Module } from "@nestjs/common"
import { JunctionsController } from "./junctions.controller"
import { JunctionsService } from "./junctions.service"

@Module({
  controllers: [JunctionsController],
  providers: [JunctionsService],
  exports: [JunctionsService],
})
export class JunctionsModule {}
