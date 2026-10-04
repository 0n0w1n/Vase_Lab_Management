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

**Done in Iteration 3**
- Web login wired to the JWT API
- Requests are saved under, and filtered by, the signed-in user
- Role check with an access denied page
- Staff can view all requests and filter by status and priority
- Profile page (view and edit name, password, and organisation)
- App routing split into `(auth)` and `(main)`

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
- Gantt chart: [docs/GantChart/](docs/GantChart/)
- Architecture / sequence / use case diagrams: [docs/Diagram/](docs/Diagram/)
