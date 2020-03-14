import { Audit } from '../../CommonsModule';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { User } from '../../UserModule';
import { Test } from './test.entity';
import { Min } from 'class-validator';
import { TestResultEnum } from '../enum';

@Entity()
export class TestAttempt extends Audit {
  
  @ManyToOne<User>('User', (user: User) => user.testAttempts, { primary: true })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  @Expose()
  user: User;

  @ManyToOne<Test>('Test', (test: Test) => test.testAttempts, { primary: true })
  @JoinColumn({
    name: 'test_id',
    referencedColumnName: 'id',
  })
  @Expose()
  test: Test;
  
  @PrimaryColumn()
  @Expose()
  @Min(1)
  testNumber: number;

  @Column({
    nullable: false,
    name: 'test_result',
    type: 'enum',
    enum: TestResultEnum,
  })
  @Expose()
  testResult: TestResultEnum;
}
