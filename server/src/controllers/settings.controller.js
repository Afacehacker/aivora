import SiteSettings from '../models/SiteSettings.js';
import catchAsync from '../utils/catchAsync.js';
import { successResponse } from '../utils/apiResponse.js';

// Helper to get or create settings doc
const getOrCreateSettings = async () => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  return settings;
};

/**
 * GET /api/v1/settings — Public (safe fields)
 */
export const getSiteSettings = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();

  const publicSettings = {
    heroHeadline: settings.heroHeadline,
    heroSubHeadline: settings.heroSubHeadline,
    heroCTAPrimary: settings.heroCTAPrimary,
    heroCTASecondary: settings.heroCTASecondary,
    featuredCourses: settings.featuredCourses,
    testimonials: settings.testimonials.filter((t) => t.isApproved),
    faqs: settings.faqs.sort((a, b) => a.order - b.order),
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    contactAddress: settings.contactAddress,
    socialLinks: settings.socialLinks,
    footerText: settings.footerText,
    announcementBanner: settings.announcementBanner,
    seoSettings: settings.seoSettings,
    paymentAccounts: (settings.paymentAccounts || []).filter((acc) => acc.isActive !== false),
    paymentNotice: settings.paymentNotice,
  };

  return successResponse(res, 200, 'Site settings fetched.', publicSettings);
});

/**
 * GET /api/v1/settings/admin — Admin full settings
 */
export const getAdminSettings = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  return successResponse(res, 200, 'Admin settings fetched.', settings);
});

/**
 * PATCH /api/v1/settings — Admin
 */
export const updateSiteSettings = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();

  const allowedFields = [
    'heroHeadline', 'heroSubHeadline', 'heroCTAPrimary', 'heroCTASecondary',
    'featuredCourses', 'contactEmail', 'contactPhone', 'contactAddress',
    'socialLinks', 'footerText', 'announcementBanner', 'seoSettings', 'faqs', 'testimonials',
    'paymentAccounts', 'paymentNotice',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  });

  await settings.save();
  return successResponse(res, 200, 'Settings updated successfully.', settings);
});

/**
 * GET /api/v1/settings/faqs — Public/Admin
 */
export const getFAQs = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  return successResponse(res, 200, 'FAQs fetched.', settings.faqs.sort((a, b) => a.order - b.order));
});

/**
 * POST /api/v1/settings/faqs — Admin create FAQ item
 */
export const createFAQItem = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  const { question, answer, order } = req.body;
  settings.faqs.push({ question, answer, order: order ?? settings.faqs.length + 1 });
  await settings.save();
  return successResponse(res, 201, 'FAQ added.', settings.faqs);
});

/**
 * PATCH /api/v1/settings/faqs/:id — Admin update FAQ item
 */
export const updateFAQItem = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  const faq = settings.faqs.id(req.params.id);
  if (faq) {
    if (req.body.question !== undefined) faq.question = req.body.question;
    if (req.body.answer !== undefined) faq.answer = req.body.answer;
    if (req.body.order !== undefined) faq.order = req.body.order;
    await settings.save();
  }
  return successResponse(res, 200, 'FAQ updated.', settings.faqs);
});

/**
 * DELETE /api/v1/settings/faqs/:id — Admin delete FAQ item
 */
export const deleteFAQItem = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  settings.faqs = settings.faqs.filter((f) => String(f._id) !== String(req.params.id));
  await settings.save();
  return successResponse(res, 200, 'FAQ deleted.', settings.faqs);
});

/**
 * PATCH /api/v1/settings/faqs — Admin bulk replace FAQs
 */
export const updateFAQ = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  settings.faqs = req.body.faqs || [];
  await settings.save();
  return successResponse(res, 200, 'FAQs updated successfully.', settings.faqs);
});

/**
 * GET /api/v1/settings/testimonials — Public/Admin
 */
export const getTestimonials = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  return successResponse(res, 200, 'Testimonials fetched.', settings.testimonials);
});

/**
 * POST /api/v1/settings/testimonials — Admin add testimonial
 */
export const createTestimonialItem = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  const { name, role, avatar, rating, comment, isApproved } = req.body;
  settings.testimonials.push({
    name,
    role: role || 'AIVORA Student',
    avatar: avatar || null,
    rating: rating || 5,
    comment,
    isApproved: isApproved !== undefined ? isApproved : true,
  });
  await settings.save();
  return successResponse(res, 201, 'Testimonial added.', settings.testimonials);
});

/**
 * PATCH /api/v1/settings/testimonials/:id — Admin update testimonial
 */
export const updateTestimonialItem = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  const item = settings.testimonials.id(req.params.id);
  if (item) {
    ['name', 'role', 'avatar', 'rating', 'comment', 'isApproved'].forEach((f) => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });
    await settings.save();
  }
  return successResponse(res, 200, 'Testimonial updated.', settings.testimonials);
});

/**
 * DELETE /api/v1/settings/testimonials/:id — Admin delete testimonial
 */
export const deleteTestimonialItem = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  settings.testimonials = settings.testimonials.filter((t) => String(t._id) !== String(req.params.id));
  await settings.save();
  return successResponse(res, 200, 'Testimonial deleted.', settings.testimonials);
});

/**
 * PATCH /api/v1/settings/testimonials — Admin bulk replace testimonials
 */
export const updateTestimonials = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  settings.testimonials = req.body.testimonials || [];
  await settings.save();
  return successResponse(res, 200, 'Testimonials updated successfully.', settings.testimonials);
});

/**
 * GET /api/v1/settings/payment-accounts — Public/Admin
 */
export const getPaymentAccounts = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  const isAdmin = req.user && req.user.role === 'admin';
  const accounts = isAdmin
    ? settings.paymentAccounts || []
    : (settings.paymentAccounts || []).filter((a) => a.isActive !== false);

  return successResponse(res, 200, 'Payment accounts fetched.', {
    paymentAccounts: accounts,
    paymentNotice: settings.paymentNotice,
  });
});

/**
 * POST /api/v1/settings/payment-accounts — Admin add payment account
 */
export const createPaymentAccount = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  const { bankName, accountName, accountNumber, instructions, isActive } = req.body;
  settings.paymentAccounts.push({
    bankName,
    accountName,
    accountNumber,
    instructions: instructions || '',
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  });
  await settings.save();
  return successResponse(res, 201, 'Payment account added successfully.', settings.paymentAccounts);
});

/**
 * PATCH /api/v1/settings/payment-accounts/:id — Admin update payment account
 */
export const updatePaymentAccount = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  const item = settings.paymentAccounts.id(req.params.id);
  if (item) {
    ['bankName', 'accountName', 'accountNumber', 'instructions', 'isActive'].forEach((f) => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });
    await settings.save();
  }
  return successResponse(res, 200, 'Payment account updated.', settings.paymentAccounts);
});

/**
 * DELETE /api/v1/settings/payment-accounts/:id — Admin remove payment account
 */
export const deletePaymentAccount = catchAsync(async (req, res) => {
  const settings = await getOrCreateSettings();
  settings.paymentAccounts = (settings.paymentAccounts || []).filter(
    (acc) => String(acc._id) !== String(req.params.id)
  );
  await settings.save();
  return successResponse(res, 200, 'Payment details removed.', settings.paymentAccounts);
});
