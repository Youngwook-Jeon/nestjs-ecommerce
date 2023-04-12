import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(user: RegisterAuthDto) {
    const { email, phone } = user;
    const emailExist = await this.usersRepository.findOneBy({
      email,
    });

    if (emailExist) {
      return new HttpException(
        '이미 가입된 이메일 주소입니다.',
        HttpStatus.CONFLICT,
      );
    }
    const phoneExist = await this.usersRepository.findOneBy({
      phone,
    });

    if (phoneExist) {
      return new HttpException(
        '이미 가입된 전화번호입니다.',
        HttpStatus.CONFLICT,
      );
    }

    const newUser = this.usersRepository.create(user);
    const userSaved = await this.usersRepository.save(newUser);

    const payload = { id: userSaved.id, name: userSaved.name };
    const token = this.jwtService.sign(payload);
    const data = {
      user: userSaved,
      token: 'Bearer ' + token,
    };

    delete data.user.password;

    return data;
  }

  async login(loginData: LoginAuthDto) {
    const { email, password } = loginData;
    const userFound = await this.usersRepository.findOneBy({ email });
    if (!userFound) {
      return new HttpException(
        '가입된 메일주소가 아닙니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    const isPasswordValid = await compare(password, userFound.password);
    if (!isPasswordValid) {
      return new HttpException(
        '가입된 정보와 일치하지 않습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    const payload = { id: userFound.id, name: userFound.name };
    const token = this.jwtService.sign(payload);
    const data = {
      user: userFound,
      token: 'Bearer ' + token,
    };

    delete data.user.password;

    return data;
  }
}
