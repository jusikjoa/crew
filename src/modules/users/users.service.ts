import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/userEntity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // 사용자 생성
  async create(email: string, password: string, username: string, displayName?: string): Promise<User> {
    // 이메일 중복 확인
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    const user = this.usersRepository.create({
      email,
      password,
      username,
      displayName: displayName || null,
      isActive: true,
    });

    return await this.usersRepository.save(user);
  }

  // ID로 사용자 조회
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  // 이메일로 사용자 조회 (로그인 등에서 사용)
  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  // 사용자명으로 조회
  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { username } });
  }

  // 모든 사용자 조회
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  // 사용자 프로필 업데이트
  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    
    // 이메일 변경 시 중복 확인
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser) {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }
    }

    Object.assign(user, updateData);
    return await this.usersRepository.save(user);
  }

  // 비밀번호 업데이트
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    user.password = newPassword;
    await this.usersRepository.save(user);
  }

  // 사용자 비활성화
  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    return await this.usersRepository.save(user);
  }

  // 사용자 활성화
  async activate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    return await this.usersRepository.save(user);
  }

  // 사용자 삭제
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}