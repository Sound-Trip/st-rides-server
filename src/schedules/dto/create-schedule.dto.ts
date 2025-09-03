import { IsString, IsDateString, IsInt, Min } from 'class-validator';
export class CreateScheduleDto {
  @IsString() startJunctionId: string;
  @IsString() endJunctionId: string;
  @IsDateString() departureTime: string;
  @IsInt() @Min(1) capacity = 4;
}