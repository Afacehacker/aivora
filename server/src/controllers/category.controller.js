import Category from '../models/Category.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import generateSlug from '../utils/generateSlug.js';

/**
 * GET /api/v1/categories — Public
 */
export const getAllCategories = catchAsync(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.all === 'true' && req.user?.role === 'admin') {
    delete filter.isActive;
  }

  const categories = await Category.find(filter).sort({ order: 1, name: 1 });
  return successResponse(res, 200, 'Categories fetched.', categories);
});

/**
 * POST /api/v1/categories — Admin only
 */
export const createCategory = catchAsync(async (req, res, next) => {
  const { name, description, icon, color, order } = req.body;

  if (!name) return next(new AppError('Category name is required.', 400));

  const slug = generateSlug(name);
  const existing = await Category.findOne({ slug });
  if (existing) return next(new AppError('A category with this name already exists.', 400));

  const category = await Category.create({ name, slug, description, icon, color, order });
  return successResponse(res, 201, 'Category created successfully.', category);
});

/**
 * PATCH /api/v1/categories/:id — Admin only
 */
export const updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found.', 404));

  const { name, description, icon, color, order, isActive } = req.body;

  if (name && name !== category.name) {
    category.slug = generateSlug(name);
    category.name = name;
  }
  if (description !== undefined) category.description = description;
  if (icon !== undefined) category.icon = icon;
  if (color !== undefined) category.color = color;
  if (order !== undefined) category.order = order;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();
  return successResponse(res, 200, 'Category updated successfully.', category);
});

/**
 * DELETE /api/v1/categories/:id — Admin only
 */
export const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new AppError('Category not found.', 404));
  return successResponse(res, 200, 'Category deleted successfully.');
});
