This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Docker

Build locally:

```bash
docker build -t interview-platform:local .
```

Run locally (ensure required env vars are set or mount an env file):

```bash
docker run --rm -p 3000:3000 \
  --env-file .env \
  interview-platform:local
```

Minimal env vars typically required (set in your deployment environment):

- `MONGODB_URI`
- `OPENAI_API_KEY`
- `REDIS_URL` (or `REDIS_HOST`, `REDIS_PORT`)
- Any other keys referenced in `services/*.ts`

## Bitbucket Pipelines

This repo includes `bitbucket-pipelines.yml` which builds and pushes a Docker image on `main`.

Required Bitbucket repository variables:

- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_PASSWORD`: Docker Hub access token/password
- `DOCKER_IMAGE_NAME`: Target image name, e.g. `your-dockerhub-username/interview-platform`

Pipeline result: two tags pushed per build: `latest` and the short commit SHA.

### Deploy example (Docker host)

```bash
docker pull $DOCKER_IMAGE_NAME:latest
docker run -d --name interview-platform \
  --restart=always \
  -p 3000:3000 \
  --env MONGODB_URI=... \
  --env OPENAI_API_KEY=... \
  --env REDIS_URL=... \
  $DOCKER_IMAGE_NAME:latest
```