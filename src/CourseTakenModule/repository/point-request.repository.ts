import { EntityRepository, Repository } from 'typeorm';
import { PointRequest } from '../entity';
import { PointRequestStatusEnum, PointsOriginEnum } from '../enum';

@EntityRepository(PointRequest)
export class PointRequestRepository extends Repository<PointRequest> {

  public async findByUser(
    user: PointRequest['user'],
  ): Promise<PointRequest[] | undefined> {
    return this.find({ relations: ['user'], where: { user } });
  }

}
