import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // 비밀번호를 제외한 사용자 정보 반환 헬퍼 메서드
  private excludePassword(user: User): UserResponseDto {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDto;
  }

  // 사용자 생성
  async create(email: string, password: string, username: string, displayName?: string): Promise<UserResponseDto> {
    // 이메일 중복 확인
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 표시명 중복 확인 (표시명이 있는 경우)
    const displayNameToSave = displayName?.trim() || null;
    if (displayNameToSave) {
      const existingByDisplayName = await this.findByDisplayName(displayNameToSave);
      if (existingByDisplayName) {
        throw new ConflictException('이미 사용 중인 표시명입니다.');
      }
    }

    const user = this.usersRepository.create({
      email,
      password,
      username,
      displayName: displayNameToSave,
      isActive: true,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.excludePassword(savedUser);
  }

  // ID로 사용자 조회 (내부용 - 비밀번호 포함)
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  // ID로 사용자 조회 (응답용 - 비밀번호 제외)
  async findOneForResponse(id: string): Promise<UserResponseDto> {
    const user = await this.findOne(id);
    return this.excludePassword(user);
  }

  // 이메일로 사용자 조회 (로그인 등에서 사용)
  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  // 사용자명으로 조회
  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { username } });
  }

  // 표시명으로 조회
  async findByDisplayName(displayName: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { displayName } });
  }

  // 모든 사용자 조회
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find();
    return users.map(user => this.excludePassword(user));
  }

  // 사용자 프로필 업데이트
  async update(id: string, updateData: Partial<User>): Promise<UserResponseDto> {
    const user = await this.findOne(id);
    
    // 이메일 변경 시 중복 확인
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser) {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }
    }

    // 표시명 변경 시 중복 확인
    const newDisplayName = updateData.displayName !== undefined
      ? (updateData.displayName?.trim() || null)
      : undefined;
    if (newDisplayName !== undefined && newDisplayName !== user.displayName) {
      if (newDisplayName) {
        const existingByDisplayName = await this.findByDisplayName(newDisplayName);
        if (existingByDisplayName && existingByDisplayName.id !== id) {
          throw new ConflictException('이미 사용 중인 표시명입니다.');
        }
      }
    }

    if (newDisplayName !== undefined) {
      updateData = { ...updateData, displayName: newDisplayName };
    }
    Object.assign(user, updateData);
    const updatedUser = await this.usersRepository.save(user);
    return this.excludePassword(updatedUser);
  }

  // 비밀번호 업데이트
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    user.password = newPassword;
    await this.usersRepository.save(user);
  }

  // 사용자 비활성화
  async deactivate(id: string): Promise<UserResponseDto> {
    const user = await this.findOne(id);
    user.isActive = false;
    const updatedUser = await this.usersRepository.save(user);
    return this.excludePassword(updatedUser);
  }

  // 사용자 활성화
  async activate(id: string): Promise<UserResponseDto> {
    const user = await this.findOne(id);
    user.isActive = true;
    const updatedUser = await this.usersRepository.save(user);
    return this.excludePassword(updatedUser);
  }

  // 사용자 삭제
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }


}