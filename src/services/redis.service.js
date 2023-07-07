const redis = require('redis')
const { promisify } = require('node:util')
const { reservationInventory } = require('../models/repositories/inventory.repo')

const redisClient = redis.createClient()

const pexpire = promisify(redisClient.pExpire).bind(redisClient)
const setnxAsync = promisify(redisClient.setNX).bind(redisClient)

const acquireLock = async (productId, quantity, cartId) => {
    const key = `lock_v2023_${productId}`

    const retryTimes = 10

    const expireTime = 3000 //tam khoa 3s

    for (let i = 0; i < retryTimes.length; i++) {
        // tao mot key, ai nam giu thi duoc vao thanh toan

        const result = await setnxAsync(key, expireTime)

        console.log(`result:::`, result)

        if (result === 1) {
            // thao tac voi inventory

            const isReversation = await reservationInventory({ productId, quantity, cartId })

            if (isReversation.modifiedCount) {
                await pexpire(key, expireTime)
                return key
            }

            return null
        } else {
            await new Promise((resolve) => setTimeout(resolve, 50))
        }
    }
}

const releaseLock = async (keyLock) => {
    const delAsyncKey = promisify(redisClient.del).bind(redisClient)
    return await delAsyncKey(keyLock)
}

module.exports = {
    acquireLock,
    releaseLock,
}
