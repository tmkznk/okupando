import greenlock from 'greenlock-express';
import './lib/cli-env';
import { getEnv } from './lib/utils';
import { values as args } from './lib/args-definitions';
import app from './lib/express';
import * as statuses from './static/lib/statuses';
import { setStatus } from './lib/status';
import { notifyAboutFree } from './lib/push';
import {
    createStatusObserver as createRPiGpioStatusObserver,
} from './lib/status/observer/rpi-gpio';
import {
    createStatusObserver as createDebugStatusObserver,
} from './lib/status/observer/debug';

const ENV = getEnv();


async function startStatusObserver ()
{
    let statusObserver;

    if (args.GPIO_CHANNEL)
    {
        statusObserver = await createRPiGpioStatusObserver({
            channel: args.GPIO_CHANNEL,
        });
    }
    else if (ENV === 'development')
    {
        console.info('Using debug development status change observer.'); // TODO Elaborate
        statusObserver = await createDebugStatusObserver();
    }
    else
    {
        throw new Error('GPIO_CHANNEL not configured');
    }

    statusObserver.on('change', ({ status }) => {
        setStatus(status);

        if (status === statuses.FREE)
        {
            notifyAboutFree();
        }
    });
}

function startHttpServer ()
{
    if (args.HTTPS_PORT)
    {
        greenlock.create({
            server: 'https://acme-v02.api.letsencrypt.org/directory',
            version: 'draft-11',
            email: args.ACME_EMAIL,
            configDir: '~/.config/acme',
            agreeTos: true,
            communityMember: false,
            telemetry: true,
            servername: args.HOST,
            approveDomains: [args.HOST],
            app,
        }).listen(
            args.HTTP_PORT,
            args.HTTPS_PORT,
            () => {
                console.log(
                    'HTTP',
                    'Listening on',
                    `http://${args.HOST}:${args.HTTP_PORT}`,
                );
            },
            () => {
                console.log(
                    'HTTP',
                    'Listening on',
                    `https://${args.HOST}:${args.HTTPS_PORT}`
                );
            },
        );
    }
    else
    {
        app.listen(args.HTTP_PORT, args.HOST, () => {
            console.log(
                'HTTP',
                'Listening on',
                `http://${args.HOST}:${args.HTTP_PORT}`
            );
        });
    }
}

startStatusObserver();
startHttpServer();
