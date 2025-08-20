import { UserRole } from '@prisma/client';
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