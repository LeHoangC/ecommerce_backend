const discountModel = require('../models/discount.model')
const { BadRequestError, NotFoundError } = require('../core/error.response')
const { convertToObjectIdMongodb, removeUndefinedObject } = require('../utils')
const {
    checkDiscountExists,
    findAllDiscountCodeUnSelect,
    updateDiscountById,
} = require('../models/repositories/discount.repo')
const { findAllProducts } = require('../models/repositories/product.repo')

class DiscountService {
    static async createDiscountCode(payload) {
        const {
            code,
            start_date,
            end_date,
            is_active,
            shopId,
            min_order_value,
            product_ids,
            applies_to,
            name,
            description,
            type,
            value,
            max_value,
            max_uses,
            max_uses_per_user,
            uses_count,
            users_user,
        } = payload

        if (new Date() > new Date(start_date) || new Date() > new Date(end_date)) {
            throw new BadRequestError('Discount code has expried!')
        }

        if (new Date(start_date) >= new Date(end_date)) {
            throw new BadRequestError('Start date must be before end date')
        }

        const foundDiscount = await checkDiscountExists({
            model: discountModel,
            filter: {
                discount_code: code,
                discount_shopId: convertToObjectIdMongodb(shopId),
            },
        })

        if (foundDiscount && foundDiscount.discount_is_active) {
            throw new BadRequestError('Discount exists!')
        }

        const newDiscount = discountModel.create({
            discount_name: name,
            discount_description: description,
            discount_type: type,
            discount_value: value,
            discount_code: code,
            discount_start_date: new Date(start_date),
            discount_end_date: new Date(end_date),
            discount_max_uses: max_uses,
            discount_uses_count: uses_count,
            discount_users_used: users_user,
            discount_user_per_used: max_uses_per_user,
            discount_min_order_value: min_order_value || 0,
            discount_max_value: max_value,
            discount_shopId: shopId,
            discount_is_active: is_active,
            discount_applies_to: applies_to,
            discount_product_ids: applies_to === 'all' ? [] : product_ids,
        })

        return newDiscount
    }

    static async updateDiscountCode({ discountId, bodyUpdate }) {
        const objectParam = removeUndefinedObject(bodyUpdate)
        return await updateDiscountById({ discountId, bodyUpdate: objectParam })
    }

    static async getAllProductWithDiscountCode({ code, shopId, limit, page }) {
        const foundDiscount = await checkDiscountExists({
            model: discountModel,
            filter: {
                discount_code: code,
                discount_shopId: convertToObjectIdMongodb(shopId),
            },
        })

        if (!foundDiscount && !foundDiscount.discount_is_active) {
            return new NotFoundError('Discount not exists!')
        }

        const { discount_applies_to, discount_product_ids } = foundDiscount

        let products
        if (discount_applies_to === 'all') {
            // get all product

            products = findAllProducts({
                filter: {
                    product_shop: convertToObjectIdMongodb(shopId),
                    isPublished: true,
                },
                limit: +limit,
                page: +page,
                sort: 'ctime',
                select: ['product_name'],
            })
        }

        if (discount_applies_to === 'specific') {
            // get the products ids

            products = findAllProducts({
                filter: {
                    _id: { $in: discount_product_ids },
                    isPublished: true,
                },
                limit: +limit,
                page: +page,
                sort: 'ctime',
                select: ['product_name'],
            })
        }

        return products
    }

    static async getAllDiscountCodesByShop({ limit, page, shopId }) {
        const discounts = await findAllDiscountCodeUnSelect({
            limit: +limit,
            page: +page,
            filter: {
                discount_shopId: convertToObjectIdMongodb(shopId),
                discount_is_active: true,
            },
            unSelect: ['__v', 'discount_shopId'],
            model: discountModel,
        })

        return discounts
    }

    static async getDiscountAmount({ codeId, userId, shopId, products }) {
        const foundDiscount = await checkDiscountExists({
            model: discountModel,
            filter: {
                discount_code: codeId,
                discount_shopId: convertToObjectIdMongodb(shopId),
            },
        })

        if (!foundDiscount) throw new BadRequestError(`Discount doesn't exists`)

        const {
            discount_is_active,
            discount_max_uses,
            discount_end_date,
            discount_min_order_value,
            discount_user_per_used,
            discount_users_used,
            discount_type,
            discount_value,
        } = foundDiscount

        if (!discount_is_active) throw new BadRequestError(`Discount expired`)
        if (!discount_max_uses) throw new BadRequestError(`Discount are out!`)

        if (new Date() > new Date(discount_end_date)) {
            throw new BadRequestError(`Discount code has expired`)
        }

        // kiem tra xem co set gia tri toi thieu hay khong

        let totalOrder = 0

        if (discount_min_order_value > 0) {
            totalOrder = products.reduce((acc, product) => {
                return acc + product.quantity * product.price
            }, 0)

            if (totalOrder < discount_min_order_value) {
                throw new BadRequestError(`Discount requires a minium order value of ${discount_min_order_value} `)
            }
        }
        if (discount_user_per_used > 0) {
            const userUsedDiscount = discount_users_used.find((user) => user.userId === userId)

            if (userUsedDiscount) {
            }
        }

        // kiem tra discount la fixed or percentage

        const amount = discount_type === 'fixed_amount' ? discount_value : totalOrder * (discount_value / 100)

        const totalPrice = totalOrder - amount

        return {
            totalOrder,
            discount: amount,
            totalPrice: totalPrice < 0 ? 0 : totalPrice,
        }
    }

    static async deleteDiscountCode({ shopId, codeId }) {
        const deleted = await discountModel.findOneAndDelete({
            discount_code: codeId,
            discount_shopId: convertToObjectIdMongodb(shopId),
        })

        return deleted
    }

    static async cancleDiscountCode({ codeId, shopId, userId }) {
        const foundDiscount = checkDiscountExists({
            model: discountModel,
            filter: {
                discount_code: codeId,
                discount_shopId: convertToObjectIdMongodb(shopId),
            },
        })

        if (!foundDiscount) throw new NotFoundError(`Discount doesn't exists`)

        const result = await discountModel.findByIdAndUpdate(foundDiscount._id, {
            $pull: {
                discount_users_used: userId,
            },
            $inc: {
                discount_max_uses: 1,
                discount_uses_count: -1,
            },
        })

        return result
    }
}

module.exports = DiscountService
