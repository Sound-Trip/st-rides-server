import { IsEnum, IsOptional, IsDateString, IsInt, Min, ValidateIf, IsString, IsLatitude, IsLongitude } from 'class-validator';
import { VehicleType, RideType } from "../../common/enums";
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