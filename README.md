# Vase Lab Management
## Group Members

| Name | GitHub Username |
|------|------------------|
| Thanathas Puttapipat | @dootless-th8 |
| Anawin Chaichana | @0n0w1n |
| Hugh Jaiden | @hugy-ku |
| Thichanon Kangkachit | @nonkrub123 |
| Hugo Desvignes | @Suro1420 |

## Project Status

🚧 **In Development**

**Done in Iteration 4**
- Operational dashboard for the lab manager
- TAs can ask to work on a request, and the lab manager approves or declines
- Lab manager can set how many TAs can work on each request
- TA workload page
- Equipment register: list and detail pages
- Message and activity log API

## Project Structure

```
.
├── docs/                      # Project documents and diagrams
│   ├── Diagram/               # Architecture, sequence, and use case diagrams
│   └── GantChart/             # Project schedule / Gantt charts
└── source/
    ├── docker-compose.yml     # Orchestrates node-app, flask-app, and mysql-db
    ├── docker-compose.dev.yml # Development compose setup
    ├── VaseLabFlask/          # Flask backend API
    └── VaseLabNext/           # Next.js frontend
```

## Documents & Diagrams

- Project proposal: [docs/SoftwareProposal.pdf](docs/SoftwareProposal.pdf)
- Iteration 1 report: [docs/Iteration1_Report.pdf](docs/Iteration1_Report.pdf)
- Iteration 2 report: [docs/Iteration2_Report.pdf](docs/Iteration2_Report.pdf)
- Iteration 3 report: [docs/Iteration3_Report.pdf](docs/Iteration3_Report.pdf)
- Iteration 4 report: [docs/Iteration4_Report.pdf](docs/Iteration4_Report.pdf)
- Gantt chart: [docs/GantChart/](docs/GantChart/)
- Architecture / sequence / use case diagrams: [docs/Diagram/](docs/Diagram/)
