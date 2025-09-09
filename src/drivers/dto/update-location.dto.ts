import { IsBoolean, IsLatitude, IsLongitude, IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';
export class UpdateLocationDto {
  @IsLatitude() lat: number;
  @IsLongitude() lng: number;
  @IsBoolean() isOnline: boolean;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
}

export class CreateScheduleDto {
  @IsString() startJunctionId: string;
  @IsString() endJunctionId: string;
  @IsDateString() departureTime: string;
  @IsInt() @Min(1) capacity = 4;
}