# Vase Lab Management
## Group Members

| Name | GitHub Username | Student ID |
|------|------------------|------------|
| Thanathas Puttapipat | @dootless-th8 | 6810545638
| Anawin Chaichana | @0n0w1n | 6810545964
| Hugh Jaiden | @hugy-ku | 6810546006
| Thichanon Kangkachit | @nonkrub123 | 6810545611
| Hugo Desvignes | @Suro1420 | 6810546715

## Requirements

- Docker Desktop installed and running.
- Available ports 3000, 8000, and 3307

## Deploy the App (Linux server)

Production only needs Docker and port **3000** open on the server. The backend and database are not exposed.

1. **Clone the repository** and go into `source/`:

   ```sh
   git clone https://github.com/0n0w1n/Vase_Lab_Management.git
   cd Vase_Lab_Management/source
   ```

2. **Create the production settings file.** Copy the example to `.env.prod` (this file is git-ignored, so your secrets stay off GitHub):

   ```sh
   cp .env.prod.example .env.prod
   ```

3. **Replace every value with your own secret.** Open `.env.prod` and change all of the values. Do not keep the example values (`vase`, `abc`, `12345`, ...). Leave the `COMPOSE_FILE` lines as they are: they switch the app to production mode.

   | Variable | What it is |
   |---|---|
   | `DB_SECRET_KEY`, `DB_JWT_SECRET_KEY` | Long random strings used to sign sessions and login tokens |
   | `DB_ROOT_PASS`, `DB_USER`, `DB_PASS`, `DB_NAME` | MySQL root password, app user, app password and database name |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The first admin account, created automatically on first start |
   | `N_WORKERS` | Number of backend worker processes (4 is fine for a small server) |

   A random secret can be generated with `openssl rand -hex 32`.

4. **Start the app** from the `source/` directory:

   ```sh
   docker compose --env-file .env.prod up -d --build
   ```

   `--env-file .env.prod` is what selects production: without it, Docker uses `.env` and starts the development setup instead. On start the app runs the database migrations, creates the admin account if it doesn't exist, and then starts the website. The first build can take a few minutes.

5. **Open the site** at `http://<server-address>:3000` and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

> **Keep `.env.prod` private.** It contains real passwords. It is already in `.gitignore`, so don't force-add it.

**Useful commands** (run in `source/`, always with `--env-file .env.prod`):

| Task | Command |
|---|---|
| Check that everything is running | `docker compose --env-file .env.prod ps` |
| View logs | `docker compose --env-file .env.prod logs -f` |
| Update to the latest version | `git pull`, then `docker compose --env-file .env.prod up -d --build` |
| Stop the app | `docker compose --env-file .env.prod down` (the database and uploaded files are kept) |


## Run the App as development environment

From the project root, run:

```sh
cd source
docker compose up --build
```


Once the services have started, open [http://localhost:3000](http://localhost:3000) in your browser.


## Project Structure

```
.
├── docs/                      # Project documents and diagrams
│   ├── Diagram/               # Architecture, sequence, and use case diagrams
│   └── GantChart/             # Project schedule / Gantt charts
└── source/
    ├── docker-compose.yml     # Orchestrates node-app, flask-app, and mysql-db
    ├── docker-compose.dev.yml # Development compose setup
    ├── docker-compose.prod.yml # Production compose setup
    ├── VaseLabFlask/          # Flask backend API
    └── VaseLabNext/           # Next.js frontend
```

## Documents & Diagrams

- Project proposal: [docs/SoftwareProposal.pdf](docs/SoftwareProposal.pdf)
- Iteration 1 report: [docs/Iteration1_Report.pdf](docs/Iteration1_Report.pdf)
- Iteration 2 report: [docs/Iteration2_Report.pdf](docs/Iteration2_Report.pdf)
- Iteration 3 report: [docs/Iteration3_Report.pdf](docs/Iteration3_Report.pdf)
- Iteration 4 report: [docs/Iteration4_Report.pdf](docs/Iteration4_Report.pdf)
- Iteration 5 report: [docs/Iteration5_Report.pdf](docs/Iteration5_Report.pdf)
- Gantt chart: [docs/GantChart/](docs/GantChart/)
- Architecture / sequence / use case diagrams: [docs/Diagram/](docs/Diagram/)
