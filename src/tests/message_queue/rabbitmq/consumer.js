const amqp = require('amqplib')

const runConsumer = async () => {
    try {
        const connection = await amqp.connect('amqp://guest:cu@ng2002@localhost')
        const channel = await connection.createChannel()

        const queueName = 'test-topic'
        await channel.assertQueue(queueName, {
            durable: true,
        })

        channel.consume(
            queueName,
            (messages) => {
                console.log(`received ${messages.content.toString()}`)
            },
            {
                noAck: true,
            }
        )
    } catch (error) {
        console.error(error)
    }
}

runConsumer().catch(console.error)
