# Vase Lab Management

## Requirements

- Docker Desktop installed and running.
- Available ports 3000, 8000, and 3307

## Run the App

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
