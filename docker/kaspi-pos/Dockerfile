# Kaspi Pay sidecar: https://github.com/tapter-dev/kaspi-pos-automation pinned to a reviewed commit.
# Internal-only service (no published ports): its /api/auth endpoints are unauthenticated.
# Euroline backend owns session storage and payment-status polling; this container only signs Kaspi requests.
FROM node:20-alpine

ARG KASPI_POS_REPO=https://github.com/tapter-dev/kaspi-pos-automation.git
ARG KASPI_POS_REF=175577ee1b34437dba46fb9bb0c8706f57f3b311

RUN apk add --no-cache --virtual .build git \
    && git clone "$KASPI_POS_REPO" /app \
    && cd /app && git checkout "$KASPI_POS_REF" \
    && rm -rf .git public test docs \
    && apk del .build

WORKDIR /app
RUN npm ci --omit=dev

# 1) Backend polls statuses itself — disable the sidecar's own polling loop (avoids double traffic to Kaspi).
# 2) loggedFetch prints full request headers/bodies (session tokens, phones) to stdout — silence it.
# 3) Device identity / keys must survive container rebuilds: persist them in /app/data (volume) via symlinks.
RUN sed -i 's/^\([[:space:]]*\)startPolling();/\1\/\/ startPolling() disabled: Euroline backend polls payment status/' server.js \
    && grep -q 'startPolling() disabled' server.js \
    && sed -i 's/console\.log(/void(/g' src/helpers.js \
    && mkdir -p /app/data \
    && for f in keypair.json device.json ecdh-keypair.json tracked-payments.json webhook-retries.json; do ln -sf /app/data/$f /app/$f; done

ENV PORT=3000 NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
