import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserResponseDto } from './dto/user-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUserResponse: UserResponseDto = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findAll: jest.fn(),
    findOneForResponse: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUserResponse];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no users exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = '1';
      mockUsersService.findOneForResponse.mockResolvedValue(mockUserResponse);

      const result = await controller.findOne(userId);

      expect(result).toEqual(mockUserResponse);
      expect(service.findOneForResponse).toHaveBeenCalledWith(userId);
      expect(service.findOneForResponse).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = '999';
      mockUsersService.findOneForResponse.mockRejectedValue(
        new NotFoundException('사용자를 찾을 수 없습니다.'),
      );

      await expect(controller.findOne(userId)).rejects.toThrow(NotFoundException);
      expect(service.findOneForResponse).toHaveBeenCalledWith(userId);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        displayName: 'Test User',
      };

      mockUsersService.create.mockResolvedValue(mockUserResponse);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockUserResponse);
      expect(service.create).toHaveBeenCalledWith(
        createUserDto.email,
        createUserDto.password,
        createUserDto.username,
        createUserDto.displayName,
      );
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should create a user without displayName', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };

      const userWithoutDisplayName = { ...mockUserResponse, displayName: null };
      mockUsersService.create.mockResolvedValue(userWithoutDisplayName);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(userWithoutDisplayName);
      expect(service.create).toHaveBeenCalledWith(
        createUserDto.email,
        createUserDto.password,
        createUserDto.username,
        undefined,
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'testuser',
      };

      mockUsersService.create.mockRejectedValue(
        new ConflictException('이미 존재하는 이메일입니다.'),
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
        username: 'updateduser',
        displayName: 'Updated User',
      };

      const updatedUser = { ...mockUserResponse, ...updateUserDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should update only provided fields', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = {
        displayName: 'New Display Name',
      };

      const updatedUser = { ...mockUserResponse, displayName: 'New Display Name' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = '999';
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
      };

      mockUsersService.update.mockRejectedValue(
        new NotFoundException('사용자를 찾을 수 없습니다.'),
      );

      await expect(controller.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = {
        email: 'existing@example.com',
      };

      mockUsersService.update.mockRejectedValue(
        new ConflictException('이미 존재하는 이메일입니다.'),
      );

      await expect(controller.update(userId, updateUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const userId = '1';
      const updatePasswordDto: UpdatePasswordDto = {
        newPassword: 'newpassword123',
      };

      mockUsersService.updatePassword.mockResolvedValue(undefined);

      await controller.updatePassword(userId, updatePasswordDto);

      expect(service.updatePassword).toHaveBeenCalledWith(userId, updatePasswordDto.newPassword);
      expect(service.updatePassword).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = '999';
      const updatePasswordDto: UpdatePasswordDto = {
        newPassword: 'newpassword123',
      };

      mockUsersService.updatePassword.mockRejectedValue(
        new NotFoundException('사용자를 찾을 수 없습니다.'),
      );

      await expect(controller.updatePassword(userId, updatePasswordDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('activate', () => {
    it('should activate a user', async () => {
      const userId = '1';
      const activatedUser = { ...mockUserResponse, isActive: true };
      mockUsersService.activate.mockResolvedValue(activatedUser);

      const result = await controller.activate(userId);

      expect(result).toEqual(activatedUser);
      expect(result.isActive).toBe(true);
      expect(service.activate).toHaveBeenCalledWith(userId);
      expect(service.activate).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = '999';
      mockUsersService.activate.mockRejectedValue(
        new NotFoundException('사용자를 찾을 수 없습니다.'),
      );

      await expect(controller.activate(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a user', async () => {
      const userId = '1';
      const deactivatedUser = { ...mockUserResponse, isActive: false };
      mockUsersService.deactivate.mockResolvedValue(deactivatedUser);

      const result = await controller.deactivate(userId);

      expect(result).toEqual(deactivatedUser);
      expect(result.isActive).toBe(false);
      expect(service.deactivate).toHaveBeenCalledWith(userId);
      expect(service.deactivate).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = '999';
      mockUsersService.deactivate.mockRejectedValue(
        new NotFoundException('사용자를 찾을 수 없습니다.'),
      );

      await expect(controller.deactivate(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const userId = '1';
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove(userId);

      expect(service.remove).toHaveBeenCalledWith(userId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = '999';
      mockUsersService.remove.mockRejectedValue(
        new NotFoundException('사용자를 찾을 수 없습니다.'),
      );

      await expect(controller.remove(userId)).rejects.toThrow(NotFoundException);
    });
  });
});

