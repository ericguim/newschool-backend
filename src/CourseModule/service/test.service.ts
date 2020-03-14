import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { TestRepository } from '../repository';
import { Part, Test, TestAttempt } from '../entity';
import { NewTestDTO, TestUpdateDTO } from '../dto';
import { MoreThan } from 'typeorm';
import { PartService } from './part.service';
import { CourseTakenService } from '../../CourseTakenModule';
import { User, UserService } from '../../UserModule';
import { TestResultEnum } from '../enum';

@Injectable()
export class TestService {
  constructor(
    private readonly partService: PartService,
    private readonly repository: TestRepository,
    private readonly userService: UserService,
    private readonly courseTakenService: CourseTakenService,
  ) {}

  @Transactional()
  public async add(test: NewTestDTO): Promise<Test> {
    const part: Part = await this.partService.findById(test.partId);
    const testSameTitle: Test = await this.repository.findByTitleAndPartId(
      test.title,
      part,
    );
    if (testSameTitle) {
      throw new ConflictException(
        'There is already a test with this title for this part',
      );
    }

    return this.repository.save({
      ...test,
      part,
      sequenceNumber: 1 + (await this.repository.count({ part })),
    });
  }

  @Transactional()
  public async update(
    id: Test['id'],
    testUpdatedInfo: TestUpdateDTO,
  ): Promise<Test> {
    const test: Test = await this.repository.findByIdWithPart(id);
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    const part =
      testUpdatedInfo.partId === test.part.id
        ? test.part
        : await this.partService.findById(testUpdatedInfo.partId);
    return this.repository.save({ ...test, ...testUpdatedInfo, part });
  }

  @Transactional()
  public async getAll(part: Test['part']): Promise<Test[]> {
    return this.repository.find({ part });
  }

  @Transactional()
  public async findById(id: Test['id']): Promise<Test> {
    const test: Test = await this.repository.findOne({ id });
    if (!test) {
      throw new NotFoundException('No test found');
    }
    return test;
  }

  @Transactional()
  public async delete(id: Test['id']): Promise<void> {
    const deletedTest: Test = await this.repository.findOne(
      { id },
      { relations: ['part'] },
    );
    const testQuantity: number = await this.repository.count({
      part: deletedTest.part,
    });
    await this.repository.delete({ id });

    if (deletedTest.sequenceNumber === testQuantity) {
      return;
    }

    const tests: Test[] = await this.repository.find({
      where: {
        sequenceNumber: MoreThan(deletedTest.sequenceNumber),
      },
      order: {
        sequenceNumber: 'ASC',
      },
    });

    for (const test of tests) {
      await this.repository.save({
        ...test,
        sequenceNumber: test.sequenceNumber - 1,
      });
    }
  }

  @Transactional()
  public async checkTest(
    userId: User['id'],
    id: Test['id'],
    chosenAlternative: string,
  ): Promise<boolean> {
    const test = await this.repository.findById({ id });
    if (!test) {
      throw new NotFoundException('No test found');
    }

    const user = await this.userService.findById(userId)
    const result = test.correctAlternative.toUpperCase() == chosenAlternative.toUpperCase();

    if (result) {
      
      await this.addNewTestAttempt(await this.prepareTestAttempt(user, test, result ? TestResultEnum.CORRECT : TestResultEnum.WRONG));
      this.courseTakenService.addPointRequest(user);
    }

    return result;
  }

  @Transactional()
  private async prepareTestAttempt(user: User, test: Test, result: TestResultEnum): Promise<TestAttemptDTO>{

    return this.testAttemptMapper.toNewTestAttemptDTO(user, test, result);
  }

  @Transactional()
  private async addNewTestAttempt(testAttempt: NewTestAttemptDTO): Promise<void>{
    if(await this.testAttemptRepository.checkTestAlreadyPassed(testAttempt.user, testAttempt.test)){
      await this.testAttemptRepository.save({
        ...testAttempt,
        testNumber: 1 + (await this.repository.count({ where: { user: testAttempt.user, test: testAttempt.test } })),
      });
    }
  }

  @Transactional()
  public async countByPart(part: Part): Promise<number> {
    return await this.repository.count({ part });
  }

  @Transactional()
  public async getTestIdByPartIdAndSeqNum(
    part: string,
    sequenceNumber: number,
  ): Promise<Test['id']> {
    Test['part'] = part;
    const test = await this.repository.findOne({
      part: Test['part'],
      sequenceNumber,
    });
    return test.id;
  }

  @Transactional()
  public async getByPartAndSequenceNumber(
    part: Part,
    sequenceNumber: number,
  ): Promise<Test> {
    return await this.repository.findOne({
      part,
      sequenceNumber,
    });
  }

  @Transactional()
  public async findTestByPartIdAndSeqNum(
    part: string,
    sequenceNumber: number,
  ): Promise<Test> {
    Test['part'] = part;
    const test = await this.repository.findOne({
      part: Test['part'],
      sequenceNumber,
    });
    return test;
  }
}
