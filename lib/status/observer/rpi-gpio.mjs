import gpio from 'rpi-gpio';
import EventEmitter from 'events';
import * as statuses from '../../../static/lib/statuses';

const eventEmitter = new EventEmitter();


function valueToStatus (value)
{
    if (value === true)
    {
        return statuses.FREE;
    }

    if (value === false)
    {
        return statuses.OCCUPIED;
    }

    throw new Error(`Unexpected status value: ${value}`);
}


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

    let oldStatus = valueToStatus(await gpio.promise.read(channel));

    gpio.on('change', (newValueChannel, newValue) => {
        if (newValueChannel !== channel)
        {
            return;
        }

        const newStatus = valueToStatus(newValue);

        if (newStatus === oldStatus)
        {
            return;
        }

        eventEmitter.emit('change', {
            previousStatus: oldStatus,
            status: newStatus,
        });

        oldStatus = newStatus;
    });

    return {
        on: (event, handler) => {
            eventEmitter.on(event, handler);
            handler({ status: oldStatus });
        },
    };
}

export {
    createStatusObserver,
};
