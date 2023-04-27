import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { In, Repository } from 'typeorm';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/roles/role.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Role) private rolesRepository: Repository<Role>,
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

    const rolesIds = user.rolesIds;
    const roles = await this.rolesRepository.findBy({ id: In(rolesIds) });
    newUser.roles = roles;

    const userSaved = await this.usersRepository.save(newUser);
    const rolesString = userSaved.roles.map((role) => role.id);

    const payload = {
      id: userSaved.id,
      name: userSaved.name,
      roles: rolesString,
    };
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
    const userFound = await this.usersRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
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

    const rolesIds = userFound.roles.map((role) => role.id);

    const payload = { id: userFound.id, name: userFound.name, roles: rolesIds };
    const token = this.jwtService.sign(payload);
    const data = {
      user: userFound,
      token: 'Bearer ' + token,
    };

    delete data.user.password;

    return data;
  }
}
