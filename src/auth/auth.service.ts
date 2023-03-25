import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async register(user: RegisterUserDto) {
    const emailExist = await this.usersRepository.findOneBy({
      email: user.email,
    });

    if (emailExist) {
      return new HttpException(
        '이미 가입된 이메일 주소입니다.',
        HttpStatus.CONFLICT,
      );
    }
    const phoneExist = await this.usersRepository.findOneBy({
      phone: user.phone,
    });

    if (phoneExist) {
      return new HttpException(
        '이미 가입된 전화번호입니다.',
        HttpStatus.CONFLICT,
      );
    }

    const newUser = this.usersRepository.create(user);
    return this.usersRepository.save(newUser);
  }
}
