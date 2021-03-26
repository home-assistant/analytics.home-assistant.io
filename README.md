# analytics.home-assistant.io

This repository contains the source of the https://analytics.home-assistant.io website and the [CloudFlare worker](https://workers.cloudflare.com/) that recieves the payload from the [`analytics` integration](https://www.home-assistant.io/integrations/analytics/)

## Worker

This recieves the payload from the [`analytics` integration](https://www.home-assistant.io/integrations/analytics/) and stores that data in a KV store.

- Entries are kept for a maximum of 60 days since last update.
- 5 minutes over midnight (UTC) each night, a new dataset are generated from the values in the KV store and stored in a special key that the website can easily get.

The worker source are located in the worker directory.

## Site

The source of the https://analytics.home-assistant.io website.

The website is bundled with [Vite](https://vitejs.dev/) and served with [CloudFlare pages](https://pages.cloudflare.com/).

The website source are located in the site directory.

## Development

To do local development of the website first clone the repository and open the devcontainer.
Once the devcontainer has started run `script/develop` in the terminal, a preview of the site will open in your default browser.
