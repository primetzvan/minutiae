import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Finger } from './entities/finger.entity';
import { User } from '../users/entities/user.entity';
import { CreateFingerDto } from './dto/create-finger.entity';
import { nanoid } from "nanoid";

let sessionIdCache;

@Injectable()
export class FingersService {
  constructor(
    @InjectRepository(Finger)
    private readonly fingerRepository: Repository<Finger>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createFingerDto: CreateFingerDto) {
    const user = await this.findUserById(createFingerDto.userId);

    if (user.finger !== null) {
      throw new BadRequestException(
        `User '${createFingerDto.userId}' already has a finger, please remove finger before creating a new one`,
      );
    }

    sessionIdCache = nanoid(10);

    const f = this.fingerRepository.create({
      sessionId: sessionIdCache,
      user: user,
      sessionExpires: new Date(Date.now() + 1000 * 60 * parseInt(process.env.CREATE_FINGER_SESSION_EXPIRES)), //TODO
    });
    await this.fingerRepository.save(f).catch((err) => {
      return err;
    });

    return sessionIdCache;
  }

  async remove(userId: string) {
    let user = await this.findUserById(userId);

    const finger = user.finger;

    // remove reference
    user = await this.userRepository.preload({
      uuid: userId,
      finger: null,
    });
    await this.userRepository.save(user);

    if (!finger) {
      throw new NotFoundException(`User '${userId}' has no finger`);
    }

    // remove finger
    return this.fingerRepository.remove(finger);
  }

  private async findUserById(userId: string) {
    const user = await this.userRepository.findOne(
      {
        uuid: userId,
      },
      {
        relations: ['finger'],
      },
    );

    if (!user) {
      throw new NotFoundException(`User '${userId}' not found`);
    }
    return user;
  }
}
