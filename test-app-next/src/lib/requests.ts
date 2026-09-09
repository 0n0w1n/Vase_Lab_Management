import type { LabRequest } from "@/types/request";

/**
 * Mock data stand-in for the Flask API. Swap the two accessors below for
 * `fetch("http://flask-app:8000/requests/...")` once the endpoints exist —
 * nothing in the UI reads this array directly.
 */
const REQUESTS: LabRequest[] = [
  {
    id: "12345",
    title: "Equipment Maintenance",
    requestedBy: "Definate",
    submittedAt: "2023-10-24T10:42:00Z",
    priority: "high",
    assignedTo: "Sarah Jenkins",
    description:
      "The centrifuge in Lab 4B is making a loud grinding noise during operation. Please inspect and perform routine maintenance as soon as possible.",
    status: "pending-review",
    attachments: [
      {
        id: "a1",
        name: "maintenance_log.pdf",
        bytes: 1_258_291,
        uploadedAt: "2023-10-24T10:44:00Z",
        kind: "document",
      },
      {
        id: "a2",
        name: "centrifuge_noise.mp4",
        bytes: 5_033_165,
        uploadedAt: "2023-10-24T10:46:00Z",
        kind: "media",
      },
    ],
    activity: [
      {
        id: "e6",
        actor: { name: "Sarah Jenkins", initials: "SJ" },
        at: "2023-10-27T15:15:00Z",
        message: "Completed maintenance. Centrifuge is now operational.",
      },
      {
        id: "e5",
        actor: { name: "Sarah Jenkins", initials: "SJ" },
        at: "2023-10-27T13:42:00Z",
        message:
          "Replaced worn bearing assembly and recalibrated speed settings.",
      },
      {
        id: "e4",
        actor: { name: "Sarah Jenkins", initials: "SJ" },
        at: "2023-10-26T16:30:00Z",
        message:
          "Ordered replacement bearing assembly (Part #CF-2847). Expected delivery: Oct 25.",
      },
      {
        id: "e3",
        actor: { name: "Sarah Jenkins", initials: "SJ" },
        at: "2023-10-24T14:15:00Z",
        message:
          "Initial inspection complete. Identified worn bearing in rotor assembly as the cause of grinding noise.",
      },
      {
        id: "e2",
        actor: { name: "Mike Chen", initials: "MC" },
        at: "2023-10-24T11:00:00Z",
        message: "Request assigned to Sarah Jenkins.",
      },
      {
        id: "e1",
        actor: { name: "System", initials: "SYS" },
        at: "2023-10-24T10:42:00Z",
        message: "Request #12345 created by Definate.",
      },
    ],
    messages: [
      {
        id: "m1",
        author: { name: "Mike Chen", initials: "MC" },
        at: "2023-10-24T09:00:00Z",
        body: "Greetings! We read this request and will now begin to progress those.",
      },
      {
        id: "m2",
        author: { name: "Sarah Jenkins", initials: "SJ" },
        at: "2023-10-24T15:30:00Z",
        body: "On it — heading to Lab 4B to take a look at the rotor assembly.",
      },
      {
        id: "m3",
        author: { name: "Sarah Jenkins", initials: "SJ" },
        at: "2023-10-25T09:10:00Z",
        body: "Replacement part is ordered. I'll pick this back up once it lands.",
      },
      {
        id: "m4",
        author: { name: "Definate", initials: "DF" },
        at: "2023-10-26T11:20:00Z",
        body: "Thanks for the update. Is the unit safe to use in the meantime?",
      },
      {
        id: "m5",
        author: { name: "Sarah Jenkins", initials: "SJ" },
        at: "2023-10-27T13:42:00Z",
        body: "Yeah, we're working on this thing. Don't you worry!",
      },
    ],
  },
  {
    id: "12346",
    title: "Reagent Restock — Ethanol 99%",
    requestedBy: "Definate",
    submittedAt: "2023-10-25T08:15:00Z",
    priority: "medium",
    assignedTo: "Mike Chen",
    description:
      "Ethanol stock in the solvent cabinet is down to two bottles. Requesting a restock of six 1L bottles before the end of the week.",
    status: "in-progress",
    attachments: [],
    activity: [
      {
        id: "e2",
        actor: { name: "Mike Chen", initials: "MC" },
        at: "2023-10-25T10:05:00Z",
        message: "Purchase order raised with the supplier.",
      },
      {
        id: "e1",
        actor: { name: "System", initials: "SYS" },
        at: "2023-10-25T08:15:00Z",
        message: "Request #12346 created by Definate.",
      },
    ],
    messages: [
      {
        id: "m1",
        author: { name: "Mike Chen", initials: "MC" },
        at: "2023-10-25T10:06:00Z",
        body: "PO is in. Delivery window is 3-5 working days.",
      },
    ],
  },
  {
    id: "12347",
    title: "Fume Hood Airflow Check",
    requestedBy: "Sarah Jenkins",
    submittedAt: "2023-10-20T14:02:00Z",
    priority: "low",
    assignedTo: null,
    description:
      "Annual airflow certification for the Lab 2A fume hood is due next month. Booking the inspection ahead of time.",
    status: "completed",
    attachments: [
      {
        id: "a1",
        name: "airflow_certificate_2022.pdf",
        bytes: 486_400,
        uploadedAt: "2023-10-20T14:03:00Z",
        kind: "document",
      },
    ],
    activity: [
      {
        id: "e1",
        actor: { name: "System", initials: "SYS" },
        at: "2023-10-20T14:02:00Z",
        message: "Request #12347 created by Sarah Jenkins.",
      },
    ],
    messages: [],
  },
];

export async function getRequests(): Promise<LabRequest[]> {
  return REQUESTS;
}

export async function getRequest(id: string): Promise<LabRequest | undefined> {
  return REQUESTS.find((request) => request.id === id);
}
