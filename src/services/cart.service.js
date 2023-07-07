const { NotFoundError } = require('../core/error.response')
const { cart } = require('../models/cart.model')
const { getProductById } = require('../models/repositories/product.repo')

class CartService {
    // START REPO CART
    // tạo giỏ hàng
    static async createUserCart({ userId, product }) {
        const query = { cart_userId: userId, cart_state: 'active' },
            updateOrInsert = {
                $addToSet: {
                    cart_products: product,
                },
            },
            options = {
                upsert: true,
                new: true,
            }

        return await cart.findOneAndUpdate(query, updateOrInsert, options)
    }

    static async updateUserCartQuantity({ userId, product }) {
        const { productId, quantity } = product
        const query = {
                cart_userId: userId,
                cart_state: 'active',
                'cart_products.productId': productId,
            },
            updateSet = {
                $inc: {
                    'cart_products.$.quantity': quantity,
                },
            },
            options = {
                upsert: true,
                new: true,
            }

        return await cart.findOneAndUpdate(query, updateSet, options)
    }

    // END REPO CART

    /* --------------> Thêm sản phẩm vào giỏ hàng */
    static async addToCart({ userId, product = {} }) {
        const userCart = await cart.findOne({ cart_userId: userId })

        // nếu k có giỏ hàng thì tạo giỏ hàng mới
        if (!userCart) {
            return await CartService.createUserCart({ userId, product })
        }

        // nếu có giỏ hàng mà chưa có sản phẩm thì thêm sản phẩm vào giỏ hàng
        if (!userCart.cart_products.length) {
            userCart.cart_products = [product]
            return await userCart.save()
        }

        // nếu có giỏ hàng, có cả sản phẩm cần thêm thì tăng số lượng sản phẩm đó lên 1
        return await CartService.updateUserCartQuantity({ userId, product })
    }

    /*
        shop_order_ids = [
            {
                shopId,
                item_products: [
                    {
                        quantity,
                        price,
                        shopId,
                        old_quntity,
                        productId
                    }
                ]
            }
        ]
    */

    static async addToCartV2({ userId, shop_order_ids }) {
        const { productId, quantity, old_quantity } = shop_order_ids[0]?.item_products[0]

        const foundProduct = await getProductById(productId)

        console.log({ foundProduct })

        if (!foundProduct) throw new NotFoundError('')

        if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId) {
            throw new NotFoundError('Product do not belong to the shop')
        }

        if (quantity === 0) {
            // delete product
        }

        return await CartService.updateUserCartQuantity({
            userId,
            product: {
                productId,
                quantity: quantity - old_quantity,
            },
        })
    }

    static async deleteUserCart({ userId, productId }) {
        const query = { cart_userId: userId, cart_state: 'active' },
            updateSet = {
                $pull: {
                    cart_products: {
                        productId,
                    },
                },
            }

        const deleteCart = await cart.updateOne(query, updateSet)

        return deleteCart
    }

    static async getListUserCart({ userId }) {
        return await cart
            .findOne({
                cart_userId: +userId,
            })
            .lean()
    }
}

module.exports = CartService
