import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DUMMY_ADDONS,
  getAddonById,
  getAddonsForService,
  ZenVidaAddon,
  ZenVidaCategory,
  ZenVidaService,
} from '../common/zenvida-catalog';
import { Product } from '../database/entities/product.entity';
import {
  CATEGORY_LABELS,
  CategoryId,
  isCategoryId,
} from '../database/enums/category-id.enum';
import { isServiceId, ServiceId } from '../database/enums/service-id.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async listCategories(): Promise<ZenVidaCategory[]> {
    const products = await this.productsRepo.find({
      order: { categoryId: 'ASC', title: 'ASC' },
    });
    return this.groupIntoCategories(products);
  }

  async getCategoryById(id: string): Promise<ZenVidaCategory | undefined> {
    if (!isCategoryId(id)) return undefined;
    const categories = await this.listCategories();
    return categories.find((category) => category.id === id);
  }

  async listServices(): Promise<ZenVidaService[]> {
    const products = await this.productsRepo.find({
      order: { categoryId: 'ASC', title: 'ASC' },
    });
    return products.map((product) => this.toZenVidaService(product));
  }

  async getServicesByCategoryId(
    categoryId: CategoryId,
  ): Promise<ZenVidaService[]> {
    const products = await this.productsRepo.find({
      where: { categoryId },
      order: { title: 'ASC' },
    });
    return products.map((product) => this.toZenVidaService(product));
  }

  async getServiceById(id: string): Promise<ZenVidaService | undefined> {
    if (!isServiceId(id)) return undefined;
    const product = await this.productsRepo.findOne({
      where: { serviceId: id },
    });
    return product ? this.toZenVidaService(product) : undefined;
  }

  async getProductByServiceId(serviceId: ServiceId): Promise<Product | null> {
    return this.productsRepo.findOne({ where: { serviceId } });
  }

  listAddons(): ZenVidaAddon[] {
    return [...DUMMY_ADDONS];
  }

  getAddonById(id: string): ZenVidaAddon | undefined {
    return getAddonById(id);
  }

  getAddonsForService(serviceId: ServiceId): ZenVidaAddon[] {
    return getAddonsForService(serviceId);
  }

  private groupIntoCategories(products: Product[]): ZenVidaCategory[] {
    const byCategory = new Map<CategoryId, ZenVidaCategory>();
    for (const product of products) {
      if (!byCategory.has(product.categoryId)) {
        byCategory.set(product.categoryId, {
          id: product.categoryId,
          name: CATEGORY_LABELS[product.categoryId],
          services: [],
        });
      }
      byCategory
        .get(product.categoryId)!
        .services.push(this.toZenVidaService(product));
    }
    return [...byCategory.values()];
  }

  private toZenVidaService(product: Product): ZenVidaService {
    const scheduledAt =
      product.scheduledAt instanceof Date
        ? product.scheduledAt.toISOString()
        : String(product.scheduledAt);

    return {
      id: product.serviceId,
      categoryId: product.categoryId,
      title: product.title,
      description: product.description,
      priceCents: product.priceCents,
      depositCents: product.depositCents,
      durationMinutes: product.durationMinutes,
      scheduledAt,
      currency: product.currency as 'usd',
    };
  }
}
