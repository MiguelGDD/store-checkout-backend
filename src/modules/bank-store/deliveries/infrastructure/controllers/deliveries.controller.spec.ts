import { NotFoundException } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from '../services/deliveries.service';

describe('DeliveriesController', () => {
  let controller: DeliveriesController;
  let deliveriesService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    assignToTransaction: jest.Mock;
  };

  beforeEach(() => {
    deliveriesService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      assignToTransaction: jest.fn(),
    };

    controller = new DeliveriesController(
      deliveriesService as unknown as DeliveriesService,
    );
  });

  it('should delegate list requests to the service', async () => {
    const deliveries = [{ id: 1 }];
    deliveriesService.findAll.mockResolvedValue(deliveries);

    await expect(controller.findAll()).resolves.toBe(deliveries);
    expect(deliveriesService.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return a delivery by id', async () => {
    const delivery = { id: 1 };
    deliveriesService.findOne.mockResolvedValue(delivery);

    await expect(controller.findOne(1)).resolves.toBe(delivery);
    expect(deliveriesService.findOne).toHaveBeenCalledWith(1);
  });

  it('should throw when a delivery does not exist', async () => {
    deliveriesService.findOne.mockResolvedValue(null);

    await expect(controller.findOne(1)).rejects.toThrow(NotFoundException);
  });

  it('should delegate assignment requests to the service', async () => {
    const delivery = { id: 1 };
    deliveriesService.assignToTransaction.mockResolvedValue(delivery);

    await expect(controller.assign(10)).resolves.toBe(delivery);
    expect(deliveriesService.assignToTransaction).toHaveBeenCalledWith(10);
  });
});
