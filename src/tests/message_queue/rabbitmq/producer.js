const amqp = require('amqplib')

const messages = 'hello rabbitMQ'

const runProducer = async () => {
    try {
        const connection = await amqp.connect('amqp://guest:cu@ng2002@localhost')
        const channel = await connection.createChannel()

        const queueName = 'test-topic'
        await channel.assertQueue(queueName, {
            durable: true,
        })

        channel.sendToQueue(queueName, Buffer.from(messages))

        console.log(`message send: `, messages)
    } catch (error) {
        console.error(error)
    }
}

runProducer().catch(console.error)
