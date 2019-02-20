import gpio from 'rpi-gpio';
import EventEmitter from 'events';

const eventEmitter = new EventEmitter();


// gpio.promise.setup exists, but is broken
async function gpioSetup (channel, direction, edge)
{
    try
    {
        return new Promise((resolve, reject) => {
            gpio.setup(
                channel,
                direction,
                edge,
                error => {
                    if (error) { reject(error); }
                    resolve();
                }
            );
        });
    }
    catch (error)
    {
        // Catching the error, because error message is too long and
        // meaningless
        throw new Error('Failed to setup Raspberry Pi GPIO');
    }
}


async function createStatusObserver ({ channel })
{
    gpio.on('error', error => { throw new Error(error); });

    gpio.setMode(gpio.MODE_BCM); // TODO Change to RPI

    await gpioSetup(channel, gpio.DIR_IN, gpio.EDGE_BOTH);

    let oldValue = await gpio.promise.read(channel);

    gpio.on('change', (newValueChannel, newValue) => {
        if (newValueChannel !== channel)
        {
            return;
        }

        if (newValue === oldValue)
        {
            return;
        }

        eventEmitter.emit('change', {
            previousStatus: oldValue,
            status: newValue,
        });

        oldValue = newValue;
    });

    return {
        on: (event, handler) => {
            eventEmitter.on(event, handler);
            handler({ status: oldValue });
        },
    };
}

export {
    createStatusObserver,
};
