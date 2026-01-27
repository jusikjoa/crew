import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UpdateUserDto } from './dto/update-user.dto';
  import { UpdatePasswordDto } from './dto/update-password.dto';
  
  @Controller('users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    // 모든 사용자 조회
    @Get()
    async findAll() {
      return await this.usersService.findAll();
    }
  
    // 특정 사용자 조회
    @Get(':id')
    async findOne(@Param('id') id: string) {
      return await this.usersService.findOneForResponse(id);
    }
  
    // 사용자 생성 (일반적으로는 AuthService에서 처리)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto) {
      return await this.usersService.create(
        createUserDto.email,
        createUserDto.password,
        createUserDto.username,
        createUserDto.displayName,
      );
    }
  
    // 사용자 프로필 업데이트
    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
      return await this.usersService.update(id, updateUserDto);
    }
  
    // 비밀번호 변경
    @Patch(':id/password')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updatePassword(
      @Param('id') id: string,
      @Body() updatePasswordDto: UpdatePasswordDto,
    ) {
      await this.usersService.updatePassword(id, updatePasswordDto.newPassword);
    }
  
    // 사용자 활성화
    @Patch(':id/activate')
    async activate(@Param('id') id: string) {
      return await this.usersService.activate(id);
    }
  
    // 사용자 비활성화
    @Patch(':id/deactivate')
    async deactivate(@Param('id') id: string) {
      return await this.usersService.deactivate(id);
    }
  
    // 사용자 삭제
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
      await this.usersService.remove(id);
    }
  }