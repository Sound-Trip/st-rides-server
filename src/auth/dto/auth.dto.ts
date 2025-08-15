import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'First Name is required' })
  firstName: string;

  @IsNotEmpty({ message: 'Last Name is required' })
  lastName: string;

  @IsNotEmpty({ message: 'Phone Number is required' })
  phone: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string
}



export class LoginDto {
  identifier: string
}



export class VerifyOtpDto {
  userId: string
  code: string
  type: string
}



export class AdminLoginDto {
  email: string
  password: string
}