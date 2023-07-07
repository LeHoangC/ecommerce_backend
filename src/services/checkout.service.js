const { findCartById } = require('../models/repositories/cart.repo')
const { BadRequestError } = require('../core/error.response')
const { checkProductByServer } = require('../models/repositories/product.repo')
const { getDiscountAmount } = require('./discount.service')
const { acquireLock, releaseLock } = require('./redis.service')
const order = require('../models/order.model')

/*

    {
        cartId,
        userId,
        shop_order_ids: [
            {
                shopId,
                shop_discounts: [
                    {
                        shopId,
                        discountId,
                        discount_code
                    }
                ],
                item_products: [
                    {
                        price,
                        quantity,
                        productId
                    }
                ]
            },
            {
                shopId,
                shop_discounts: [],
                item_products: [
                    {
                        price,
                        quantity,
                        productId
                    }
                ]
            }
        ]
    }

*/

class CheckoutService {
    static async checkoutReview({ cartId, userId, shop_order_ids = [] }) {
        const foundCart = await findCartById(cartId)
        if (!foundCart) throw new BadRequestError('Cart does not exists!')

        const checkout_order = {
                totalPrice: 0, //tong tien hang
                feeShip: 0, //phi ship
                totalDiscount: 0, //tong tien giam gia
                totalCheckout: 0, //tong tien phai tra
            },
            shop_order_ids_new = []

        // tinh tong tien bill

        for (let i = 0; i < shop_order_ids.length; i++) {
            const { shopId, shop_discounts = [], item_products = [] } = shop_order_ids[i]

            // check product available

            const checkProductServer = await checkProductByServer(item_products)

            // console.log('checkProductServer::', checkProductServer)

            if (!checkProductServer[0]) throw new BadRequestError('Order wrong!')

            // tong tien don hang
            const checkoutPrice = checkProductServer.reduce((acc, product) => {
                return acc + product.quantity * product.price
            }, 0)

            // tong tien truoc khi xu ly

            checkout_order.totalPrice += checkoutPrice

            const itemCheckout = {
                shopId,
                shop_discounts,
                priceRaw: checkoutPrice, //tien truoc khi giam gia
                priceApplyDiscount: checkoutPrice,
                item_products: checkProductServer,
            }

            // neu shop_discounts ton tai > 0, check xem co hop le hay khong

            if (shop_discounts.length > 0) {
                // gia su chi mot discount
                // tinh so tien duoc giam gia
                const { totalPrice = 0, discount = 0 } = await getDiscountAmount({
                    codeId: shop_discounts[0].codeId,
                    userId,
                    shopId,
                    products: checkProductServer,
                })

                // tong cong discount giam gia

                checkout_order.totalDiscount += discount

                if (discount > 0) {
                    itemCheckout.priceApplyDiscount = checkoutPrice - discount
                }
            }

            // tong thanh toan cuoi cung

            checkout_order.totalCheckout += itemCheckout.priceApplyDiscount

            shop_order_ids_new.push(itemCheckout)
        }

        return {
            shop_order_ids,
            shop_order_ids_new,
            checkout_order,
        }
    }

    static async orderByUser({ shop_order_ids, cartId, userId, user_address = {}, user_payment = {} }) {
        const { shop_order_ids_new, checkout_order } = await CheckoutService.checkoutReview({
            cartId,
            userId,
            shop_order_ids,
        })

        // check quantity co vuot kho hay khong
        // get new array products

        const products = shop_order_ids_new.flatMap((order) => order.item_products)

        console.log(`[1]:::`, products)

        const acquireProduct = []

        for (let i = 0; i < products.length; i++) {
            const { productId, quantity } = products[i]
            const keyLock = await acquireLock(productId, quantity, cartId)

            acquireProduct.push(keyLock ? true : false)

            if (keyLock) {
                await releaseLock(keyLock)
            }

            if (acquireProduct.includes(false)) {
                throw new BadRequestError('Một số sản phẩm đã được cập nhật, vui lòng quay lại giỏ hàng...')
            }

            const newOrder = order.create({
                order_userId: userId,
                order_checkout: checkout_order,
                order_shipping: user_address,
                order_payment: user_payment,
                order_product: shop_order_ids_new,
            })

            if (newOrder) {
                // remove product in my cart
            }

            return newOrder
        }
    }

    // get all order [user]
    static async getOrderByUser() {}

    // get one order [user]
    static async getOneOrderByUser() {}

    // cancel order [user]
    static async cancelOrderByUser() {}

    // update order status shop [Shop | Admin]
    static async updateOrderStatusByShop() {}
}

module.exports = CheckoutService
