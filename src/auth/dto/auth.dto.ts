import type { UserRole, VehicleType } from '@prisma/client';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';



export class RegisterDto {
  @IsNotEmpty({ message: 'First Name is required' })
  firstName: string;

  @IsNotEmpty({ message: 'Last Name is required' })
  lastName: string;

  @IsNotEmpty({ message: 'Phone Number is required' })
  userId: string;
}


export class LoginDto {
  @IsNotEmpty({ message: 'Property "identifier" is required, but missing' })
  identifier: string 

  @IsNotEmpty({ message: 'Property "role" is required, but missing' })
  role: UserRole 
}



export class VerifyOtpDto {
  @IsNotEmpty({ message: 'Property "userId" is required, but missing' })
  userId: string

  @IsNotEmpty({ message: 'Property "code" is required, but missing' })
  code: string

  @IsNotEmpty({ message: 'Property "type" is required, but missing' })
  type: string
}



export class AdminLoginDto {
  @IsNotEmpty({ message: 'Property "email" is required, but missing' })
  email: string

  @IsNotEmpty({ message: 'Property "password" is required, but missing' })
  password: string
}


export class CreateDriverDto {
  @IsNotEmpty({ message: 'Property "phone" is required, but missing' })
  phone: string;

  @IsNotEmpty({ message: 'Property "firstName" is required, but missing' })
  firstName: string;

  @IsNotEmpty({ message: 'Property "lastName" is required, but missing' })
  lastName: string;

  @IsNotEmpty({ message: 'Property "vehicleType" is required, but missing' })
  vehicleType: VehicleType;

  @IsNotEmpty({ message: 'Property "vehicleModel" is required, but missing' })
  vehicleModel: string;

  @IsNotEmpty({ message: 'Property "plateNumber" is required, but missing' })
  plateNumber: string;

  @IsNotEmpty({ message: 'Property "licenseNumber" is required, but missing' })
  licenseNumber: string;

  @IsNotEmpty({ message: 'Property "isCompanyVehicle" is required, but missing' })
  isCompanyVehicle?: boolean;
}