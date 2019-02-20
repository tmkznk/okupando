import EventEmitter from 'events';
import readline from 'readline';
import * as statuses from '../../../static/lib/statuses';

const SIGINT = 2;
const SIGINT_EXIT = 128 + SIGINT; // eslint-disable-line no-magic-numbers
const KEY_SEQNENCE_TO_STATUS_MAP = {
    f: statuses.FREE,
    o: statuses.OCCUPIED,
    e: statuses.ERROR,
    n: statuses.OFFLINE,
};

const eventEmitter = new EventEmitter();

function printHelp ()
{
    console.log();
    console.log('Press [foen?] to change status to free, occupied, error, offline or print this help respoectively.');
}

async function createStatusObserver ()
{
    const { stdin } = process;
    readline.emitKeypressEvents(stdin);
    stdin.setRawMode(true);

    let oldValue =
        // eslint-disable-next-line no-magic-numbers
        Math.random() > 0.5
            ? statuses.FREE : statuses.OCCUPIED;

    stdin.on('keypress', (chunk, key) => {
        if (key && key.ctrl && key.name === 'c')
        {
            process.exit(SIGINT_EXIT);
        }

        const newValue = KEY_SEQNENCE_TO_STATUS_MAP[key.sequence];

        if (newValue === undefined)
        {
            printHelp();
            return;
        }

        eventEmitter.emit('change', {
            previousStatus: oldValue,
            status: newValue,
        });

        oldValue = newValue;
    });

    printHelp();

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
