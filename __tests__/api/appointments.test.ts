import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testApiHandler } from "next-test-api-route-handler";
import * as appointmentsListHandler from "@/app/api/appointments/route";
import * as appointmentDetailHandler from "@/app/api/appointments/[id]/route";
import { PrismaClient, PetSize } from "@prisma/client";

const prisma = new PrismaClient();

describe.sequential("Appointments API", () => {
  let appointmentId: string;
  let testClientId: string;
  let testPetId: string;
  let testServiceId: string;

  beforeAll(async () => {
    await prisma.appointment.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.petShop.deleteMany({});

    await prisma.petShop.create({
      data: {
        name: "Pet Shop de Teste",
        workingHours: {
          monday: { start: "09:00", end: "18:00", open: true },
          tuesday: { start: "09:00", end: "18:00", open: true },
          wednesday: { start: "09:00", end: "18:00", open: true },
          thursday: { start: "09:00", end: "18:00", open: true },
          friday: { start: "09:00", end: "18:00", open: true },
          saturday: { start: "09:00", end: "13:00", open: true },
          sunday: { open: false },
        },
      },
    });

    const client = await prisma.client.create({
      data: { name: "Dono Para Agendamento", phone: "11999998888" },
    });
    testClientId = client.id;

    const pet = await prisma.pet.create({
      data: {
        name: "Pet Para Agendamento",
        size: PetSize.MEDIO,
        clientId: testClientId,
      },
    });
    testPetId = pet.id;

    const service = await prisma.service.create({
      data: { name: "Serviço de Teste (60 min)", duration: 60, price: 50 },
    });
    testServiceId = service.id;
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.petShop.deleteMany({});
  });

  const getNextTuesday10AM = () => {
    const date = new Date();
    date.setDate(date.getDate() + ((2 - date.getDay() + 7) % 7));
    date.setHours(10, 0, 0, 0);
    return date;
  };

  it("POST /api/appointments - deve criar um novo agendamento com sucesso", async () => {
    await testApiHandler({
      appHandler: appointmentsListHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: testClientId,
            petId: testPetId,
            serviceIds: [testServiceId],
            date: getNextTuesday10AM().toISOString(),
          }),
        });
        const json = await response.json();
        expect(response.status).toBe(201);
        expect(json).toHaveProperty("id");
        appointmentId = json.id;
      },
    });
  });

  it("POST /api/appointments - NÃO deve criar agendamento que conflita com um existente", async () => {
    await testApiHandler({
      appHandler: appointmentsListHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: testClientId,
            petId: testPetId,
            serviceIds: [testServiceId],
            date: new Date(
              getNextTuesday10AM().getTime() + 30 * 60000
            ).toISOString(),
          }),
        });
        const json = await response.json();
        expect(response.status).toBe(409);
        expect(json.message).toContain("Conflito de horário");
      },
    });
  });

  it("POST /api/appointments - NÃO deve criar agendamento fora do horário de funcionamento", async () => {
    await testApiHandler({
      appHandler: appointmentsListHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: testClientId,
            petId: testPetId,
            serviceIds: [testServiceId],
            date: new Date(
              getNextTuesday10AM().setHours(20, 0, 0, 0)
            ).toISOString(),
          }),
        });
        const json = await response.json();
        expect(response.status).toBe(400);
        expect(json.message).toContain("Horário inválido");
      },
    });
  });

  it("DELETE /api/appointments/:id - deve deletar um agendamento", async () => {
    await testApiHandler({
      appHandler: appointmentDetailHandler,
      params: { id: appointmentId },
      test: async ({ fetch }) => {
        const response = await fetch({ method: "DELETE" });
        expect(response.status).toBe(204);
      },
    });
  });
});
