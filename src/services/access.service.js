const bcrypt = require('bcryptjs')
const crypto = require('node:crypto')
const { createTokenPair, verifyJWT } = require('../auth/authUtils')
const shopModel = require('../models/shop.model')
const KeyTokenService = require('./keyToken.service')
const { getInfoData } = require('../utils')
const { BadRequestError, AuthFailureError, ForbiddenError } = require('../core/error.response')
const { findByEmail } = require('./shop.service')

const RoleShop = {
    SHOP: 'SHOP',
    WRITER: 'WRITER',
    EDITTOR: 'EDITTOR',
    ADMIN: 'ADMIN',
}

class AccessService {
    static handleRefreshTokenV2 = async ({ user, keyStore, refreshToken }) => {
        const { userId, email } = user

        if (keyStore.refreshTokensUsed.includes(refreshToken)) {
            await KeyTokenService.deleteKeyById(userId)
            throw new ForbiddenError('Something wrong happend !! Pls relogin')
        }

        if (keyStore.refreshToken !== refreshToken) throw new AuthFailureError('Shop not register 1')

        const foundShop = await findByEmail({ email })

        if (!foundShop) throw new AuthFailureError('Shop not register 2')

        const tokens = await createTokenPair({ userId: foundShop._id, email }, keyStore.publicKey, keyStore.privateKey)

        await keyStore.update({
            $set: {
                refreshToken: tokens.refreshToken,
            },
            $addToSet: {
                refreshTokensUsed: refreshToken,
            },
        })

        return {
            user,
            tokens,
        }
    }

    // static handleRefreshToken = async (refreshToken) => {
    //     const foundToken = await KeyTokenService.findByRefreshTokenUsed(refreshToken)
    //     if (foundToken) {
    //         const { userId, email } = await verifyJWT(refreshToken, foundToken.privateKey)
    //         console.log('[1] -- ', { userId, email })
    //         await KeyTokenService.deleteKeyById(userId)
    //         throw new ForbiddenError('Something wrong happend !! Pls relogin')
    //     }

    //     const holderToken = await KeyTokenService.findByRefreshToken(refreshToken)
    //     if (!holderToken) throw new AuthFailureError('Shop not register 1')

    //     const { userId, email } = await verifyJWT(refreshToken, holderToken.privateKey)

    //     console.log('[2] -- ', { userId, email })

    //     const foundShop = await findByEmail({ email })
    //     if (!foundShop) throw new AuthFailureError('Shop not register 2')

    //     const tokens = await createTokenPair(
    //         { userId: foundShop._id, email },
    //         holderToken.publicKey,
    //         holderToken.privateKey
    //     )

    //     await holderToken.update({
    //         $set: {
    //             refreshToken: tokens.refreshToken,
    //         },
    //         $addToSet: {
    //             refreshTokensUsed: refreshToken,
    //         },
    //     })

    //     return {
    //         user: { userId, email },
    //         tokens,
    //     }
    // }

    static logout = async (keyStore) => {
        // remove keytoken
        const delKey = await KeyTokenService.removeKeyById(keyStore._id)
        console.log({ delKey })
        return delKey
    }

    static login = async ({ email, password, refreshToken = null }) => {
        try {
            const foundShop = await findByEmail({ email })

            if (!foundShop) throw new BadRequestError('Shop not registered')

            const match = await bcrypt.compare(password, foundShop.password)

            if (!match) throw new AuthFailureError('Authentication error')

            const privateKey = crypto.randomBytes(64).toString('hex')
            const publicKey = crypto.randomBytes(64).toString('hex')

            const tokens = await createTokenPair({ userId: foundShop._id, email }, publicKey, privateKey)

            await KeyTokenService.createKeyToken({
                userId: foundShop._id,
                refreshToken: tokens.refreshToken,
                publicKey,
                privateKey,
            })

            return {
                shop: getInfoData(['_id', 'name', 'email'], foundShop),
                tokens,
                status: 'success',
            }
        } catch (error) {
            return {
                code: 'xxx',
                msg: error.message,
                status: 'error',
            }
        }
    }

    static signUp = async ({ name, email, password }) => {
        try {
            const holderShop = await shopModel.findOne({ email }).lean()

            if (holderShop) {
                throw new BadRequestError('Error: Shop already registered')
            }
            const passwordHash = await bcrypt.hash(password, 10)

            const newShop = await shopModel.create({
                name,
                email,
                password: passwordHash,
                roles: [RoleShop.SHOP],
            })

            if (newShop) {
                const privateKey = crypto.randomBytes(64).toString('hex')
                const publicKey = crypto.randomBytes(64).toString('hex')

                const tokens = await createTokenPair({ userId: newShop.id }, publicKey, privateKey)

                const publicKeyString = await KeyTokenService.createKeyToken({
                    userId: newShop._id,
                    publicKey,
                    privateKey,
                    refreshToken: tokens.refreshToken,
                })

                if (!publicKeyString) {
                    return {
                        code: 'xxxx',
                        message: 'publicKeyString error',
                    }
                }

                return {
                    shop: getInfoData(['_id', 'name', 'email'], newShop),
                    tokens,
                }
            }

            return {
                code: 200,
                metadata: null,
            }
        } catch (error) {
            return {
                code: 'xxx',
                msg: error.message,
                status: 'error',
            }
        }
    }
}

module.exports = AccessService
