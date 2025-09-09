import { IsEnum, IsBoolean, IsLatitude, IsLongitude, IsOptional, IsString, IsDateString, IsInt, Min, ValidateIf } from 'class-validator';
import { VehicleType, RideType } from "../../common/enums";
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

export class CreateRequestDto {
  @IsEnum(VehicleType) vehicleType: VehicleType;
  @IsEnum(RideType) rideType: RideType;

  @ValidateIf(o => o.vehicleType === VehicleType.KEKE)
  @IsString() startJunctionId?: string;

  @ValidateIf(o => o.vehicleType === VehicleType.KEKE)
  @IsString() endJunctionId?: string;

  @ValidateIf(o => o.vehicleType !== VehicleType.KEKE)
  @IsLatitude() startLat?: number;
  @ValidateIf(o => o.vehicleType !== VehicleType.KEKE)
  @IsLongitude() startLng?: number;
  @ValidateIf(o => o.vehicleType !== VehicleType.KEKE)
  @IsLatitude() endLat?: number;
  @ValidateIf(o => o.vehicleType !== VehicleType.KEKE)
  @IsLongitude() endLng?: number;

  @IsOptional() @IsDateString() scheduledFor?: string;
  @IsOptional() @IsInt() @Min(1) seatsNeeded?: number;
}