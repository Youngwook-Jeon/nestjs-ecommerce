import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  create(user: CreateUserDto) {
    const newUser = this.usersRepository.create(user);
    return this.usersRepository.save(newUser);
  }

  findAll() {
    return this.usersRepository.find();
  }

  async update(id: number, user: UpdateUserDto) {
    const userFound = await this.usersRepository.findOneBy({ id });

    if (!userFound) {
      return new HttpException(
        '존재하지 않는 유저입니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    const updatedUser = Object.assign(userFound, user);
    return this.usersRepository.save(updatedUser);
  }
}
