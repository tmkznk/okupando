let deployConfig;
try
{
    // eslint-disable-next-line global-require
    deployConfig = require('./ecosystem.config.deploy.production.js');
}
catch (error)
{
    if (error instanceof Error && error.code === 'MODULE_NOT_FOUND')
    {
        deployConfig = {};
    }
    else
    {
        throw error;
    }
}

module.exports = {
    apps: [
        {
            name: 'okupando',
            script: 'server.mjs',
        },
    ],
    deploy: {
        production: {
            ...deployConfig,
            repo: 'https://github.com/DietLabs/okupando',
            ref: 'origin/master',
            'post-deploy': 'npm install --no-package-lock && pm2 reload ./ecosystem.config.js',
        },
    },
};
