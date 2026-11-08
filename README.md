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

**Done in Iteration 5**
- File attachments: upload and download files on requests, with access limited to people on the request
- Admin can register new users
- Add, edit, and delete equipment
- Edit and delete requests, with rules based on role and request status
- Only the lab manager and admin can see and change request status and TA capacity
- Production Docker setup (`docker-compose.prod.yml` and `.env.prod.example`)
- Profile page and sidebar work better on small screens

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
