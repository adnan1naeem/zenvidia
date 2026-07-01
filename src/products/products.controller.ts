import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('categories')
  listCategories() {
    return this.products.listCategories();
  }

  @Get('categories/:id')
  async getCategory(@Param('id') id: string) {
    const category = await this.products.getCategoryById(id);
    if (!category) throw new NotFoundException(`Category not found: ${id}`);
    return category;
  }

  @Get('categories/:id/services')
  async getServicesByCategory(@Param('id') id: string) {
    const category = await this.products.getCategoryById(id);
    if (!category) throw new NotFoundException(`Category not found: ${id}`);
    return this.products.getServicesByCategoryId(category.id);
  }

  @Get('services')
  listServices() {
    return this.products.listServices();
  }

  @Get('services/:id')
  async getService(@Param('id') id: string) {
    const service = await this.products.getServiceById(id);
    if (!service) throw new NotFoundException(`Service not found: ${id}`);
    return service;
  }

  @Get('services/:id/addons')
  async getAddonsForService(@Param('id') id: string) {
    const service = await this.products.getServiceById(id);
    if (!service) throw new NotFoundException(`Service not found: ${id}`);
    return this.products.getAddonsForService(service.id);
  }

  @Get('addons')
  listAddons() {
    return this.products.listAddons();
  }

  @Get('addons/:id')
  getAddon(@Param('id') id: string) {
    const addon = this.products.getAddonById(id);
    if (!addon) throw new NotFoundException(`Addon not found: ${id}`);
    return addon;
  }
}
