import "dotenv/config";

import type { Prisma } from "@prisma/client";

import { hashPassword } from "../src/lib/password";
import { prisma } from "../src/lib/prisma";

const events = [
  {
    id: "seed-ieee-embedded-workshop-2026",
    title: "Embedded Systems Workshop: From Sensor to Edge",
    description:
      "Build a complete sensing prototype and learn how embedded devices process data at the edge. The session combines a concise technical briefing with guided, hands-on development.",
    date: new Date("2026-10-03T09:00:00+07:00"),
    location: "Robotics Laboratory, ITB Ganesha Campus",
    status: "PUBLISHED",
    imageUrl: null,
  },
  {
    id: "seed-ieee-career-talk-2026",
    title: "IEEE Career Talk: Engineering for a Sustainable Future",
    description:
      "Meet engineers working across energy, infrastructure, and technology to explore how technical careers can create measurable social impact. The program closes with an open mentoring and networking session.",
    date: new Date("2026-10-17T13:00:00+07:00"),
    location: "Multipurpose Hall, ITB Ganesha Campus",
    status: "PUBLISHED",
    imageUrl: null,
  },
  {
    id: "seed-ieee-industry-visit-2026",
    title: "Industry Visit: Smart Manufacturing at PT Len Industri",
    description:
      "Observe how digital control, instrumentation, and quality systems support modern manufacturing. Participants will join a facility tour followed by a technical discussion with the engineering team.",
    date: new Date("2026-11-07T08:00:00+07:00"),
    location: "PT Len Industri, Bandung",
    status: "PUBLISHED",
    imageUrl: null,
  },
  {
    id: "seed-ieee-joint-seminar-2026",
    title: "Joint Chapter Seminar: AI for Power and Energy Systems",
    description:
      "A cross-society seminar on practical machine-learning applications for forecasting, monitoring, and resilient energy systems. Speakers will connect current research with deployment constraints in the field.",
    date: new Date("2026-11-14T13:30:00+07:00"),
    location: "Hybrid — ITB Ganesha Campus and Zoom",
    status: "PUBLISHED",
    imageUrl: null,
  },
  {
    id: "seed-ieee-innovation-challenge-2026",
    title: "IEEE ITB Innovation Challenge 2026",
    description:
      "Student teams develop technology-driven responses to a community challenge and present working prototypes to a multidisciplinary panel. The competition includes mentoring checkpoints before the final showcase.",
    date: new Date("2026-11-28T09:00:00+07:00"),
    location: "Innovation Hub, ITB Ganesha Campus",
    status: "PUBLISHED",
    imageUrl: null,
  },
  {
    id: "seed-ieee-general-assembly-2026",
    title: "IEEE ITB Student Branch General Assembly",
    description:
      "Members review the branch program, discuss upcoming initiatives, and coordinate volunteer opportunities for the next term. This internal meeting is currently being prepared by the executive committee.",
    date: new Date("2026-12-05T10:00:00+07:00"),
    location: "IEEE ITB Student Branch Secretariat",
    status: "DRAFT",
    imageUrl: null,
  },
  {
    id: "seed-ieee-ethics-forum-2026",
    title: "Professional Ethics and Leadership Forum",
    description:
      "A facilitated discussion on ethical judgment, professional responsibility, and inclusive leadership in engineering teams. Participants work through realistic cases and compare decision-making frameworks.",
    date: new Date("2026-08-15T09:30:00+07:00"),
    location: "Seminar Room, ITB Ganesha Campus",
    status: "COMPLETED",
    imageUrl: null,
  },
  {
    id: "seed-ieee-robotics-collaboration-2026",
    title: "Robotics Society Hands-on: Autonomous Navigation",
    description:
      "A collaborative practical session introducing perception, path planning, and control for a small autonomous robot. The session was cancelled because the laboratory equipment was unavailable.",
    date: new Date("2026-09-12T08:30:00+07:00"),
    location: "Robotics Laboratory, ITB Ganesha Campus",
    status: "CANCELLED",
    imageUrl: null,
  },
] satisfies Prisma.EventUncheckedCreateInput[];

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD must be set. Copy .env.example to .env and fill them in.",
    );
  }

  const passwordHash = await hashPassword(password);

  // Upsert, bukan create, supaya seed aman dijalankan berulang kali dan
  // sekaligus berfungsi untuk mengganti password admin.
  const admin = await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  console.log(`Seeded admin account "${admin.username}"`);

  for (const event of events) {
    const { id, ...data } = event;

    await prisma.event.upsert({
      where: { id },
      update: data,
      create: event,
    });
  }

  console.log(`Seeded ${events.length} IEEE ITB Student Branch events`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
