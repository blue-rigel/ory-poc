# Ory Proof of Concept

## Getting Started

Install the dependencies:

```bash
pnpm install
```

### Local HTTP

Run the non-root development server at
[http://localhost:3000](http://localhost:3000):

```bash
pnpm dev
```

### Local HTTPS

Before using the local domain, configure wildcard `.test` DNS resolution by
following [LocalDomain.md](./LocalDomain.md). Verify that `orypoc.test` resolves
to `127.0.0.1`.

Install `mkcert` and trust its local certificate authority:

```bash
brew install mkcert
mkcert -install
```

Generate the certificate and private key expected by `pnpm dev:https`:

```bash
mkdir -p .cert
mkcert \
  -cert-file .cert/orypoc.test.pem \
  -key-file .cert/orypoc.test-key.pem \
  orypoc.test
```

The `.cert` directory is excluded from Git. Keep the private key local and do
not commit it.

Run [https://orypoc.test](https://orypoc.test) and its Ory tunnel together:

```bash
./run-https.sh
```

The script starts the Ory tunnel as the current user and runs the HTTPS server
on privileged port 443 through `sudo`. The Ory tunnel defaults to
`http://localhost:3000` when run separately. To point it at the HTTPS domain:

```bash
ORY_APP_URL=https://orypoc.test ./ory.sh
```
