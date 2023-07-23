# Daimo Explorer

Daimo Explorer is a modern, minimalist block explorer for Ethereum. It shows
onchain activity including ERC-4337 user operations.

## Quick start

```
npm i
npx prisma generate
npm run dev
```

To update your schema from E2PG, run

```
npx prisma db pull # You may have to delete models from schema.prisma first
npx run generate
```
