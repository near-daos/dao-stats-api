# DAO Stats API

[![Release version](https://img.shields.io/github/v/release/near-daos/dao-stats-api)](https://github.com/near-daos/dao-stats-api/releases/)
[![Build](https://github.com/near-daos/dao-stats-api/actions/workflows/build-deploy.yaml/badge.svg)](https://github.com/near-daos/dao-stats-api/actions/workflows/build-deploy.yaml)

A backend middleware for DAO Stats providing access to multiple DAO metrics. 

#### Technology stack

- Blockchain: **[NEAR](https://near.org/)**
- Smart Contracts: **[Sputnik DAO Factory V2](https://github.com/near-daos/sputnik-dao-contract/tree/main/sputnikdao-factory2), [Sputnik DAO V2](https://github.com/near-daos/sputnik-dao-contract/tree/main/sputnikdao2)**
- Package manager: **[Yarn](https://yarnpkg.com/)**
- Core programming language: **[TypeScript](https://www.typescriptlang.org/)**
- Application framework: **[React](https://reactjs.org/)**
- Code quality: **[Eslint](https://eslint.org/), [Prettier](https://prettier.io/)**
- Containers: **[Docker](https://www.docker.com/)**
- Deployment: **[Kubernetes](https://kubernetes.io/)**

#### Status

[Change Log](https://github.com/near-daos/dao-stats-api/releases/latest)

#### Links

##### Development
Testnet: [https://api.testnet.daostats.io](https://api.testnet.daostats.io)  

##### Production
Mainnet: [https://api.daostats.io](https://api.daostats.io)

## Getting Started

### Local Development

1. Clone the repo:
```
git clone git@github.com:near-daos/dao-stats-api.git
```

2. Open the repo folder:
```
cd dao-stats-api
```

3. Install dependencies:
```
yarn install
```

4. Add `.env.local` to the root folder with required environment variables described in `.env`.

5. Run dev docker compose:
```
docker-compose -f docker-compose-dev.yml up
```
Please make sure that Docker has been installed on your local machine.

6. Run specific service you need:

- Aggregator: `yarn start-aggregator:dev`
- API: `yarn start-api:dev`
