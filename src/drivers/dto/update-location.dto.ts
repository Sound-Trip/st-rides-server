import { IsBoolean, IsLatitude, IsLongitude, IsOptional } from 'class-validator';
export class UpdateLocationDto {
  @IsLatitude() lat: number;
  @IsLongitude() lng: number;
  @IsBoolean() isOnline: boolean;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
}
