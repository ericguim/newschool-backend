import { Audit } from '../../CommonsModule';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { PointsOriginEnum, PointRequestStatusEnum } from '../enum';
import { User } from '../../UserModule';
import { Min } from 'class-validator';

@Entity()
export class PointRequest extends Audit {
  
  @PrimaryGeneratedColumn()
  @Expose()
  @Min(1)
  id: number;

  @ManyToOne<User>('User', (user: User) => user.pointsToRegister)
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  @Expose()
  user: User;

  @Column({
    nullable: false,
    name: 'points_origin',
    type: 'enum',
    enum: PointsOriginEnum,
    default: PointsOriginEnum.MANUAL,
  })
  @Expose()
  pointsOrigin: PointsOriginEnum;

  @Column({
    nullable: false,
    name: 'request_status',
    type: 'enum',
    enum: PointRequestStatusEnum,
    default: PointRequestStatusEnum.NEW,
  })
  @Expose()
  requestStatus: PointRequestStatusEnum;

  @Column({ nullable: false, name: 'points_to_add' })
  @Expose()
  pointsToAdd: number;

}
