import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testApiHandler } from "next-test-api-route-handler";
import * as servicesListHandler from "@/app/api/services/route";
import * as serviceDetailHandler from "@/app/api/services/[id]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe.sequential("Services API", () => {
  let serviceId: string;

  beforeAll(async () => {
    await prisma.service.deleteMany({});
  });

  afterAll(async () => {
    await prisma.service.deleteMany({});
  });

  it("POST /api/services - should create a new service", async () => {
    await testApiHandler({
      appHandler: servicesListHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Banho e Tosa",
            duration: 60,
            price: 75.5,
          }),
        });
        const json = await response.json();
        expect(response.status).toBe(201);
        expect(json).toHaveProperty("id");
        serviceId = json.id;
      },
    });
  });

  it("GET /api/services - should list all services", async () => {
    await testApiHandler({
      appHandler: servicesListHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const json = await response.json();
        expect(response.status).toBe(200);
        expect(json.length).toBe(1);
      },
    });
  });

  it("PUT /api/services/:id - should update a service", async () => {
    await testApiHandler({
      appHandler: serviceDetailHandler,
      params: { id: serviceId },
      test: async ({ fetch }) => {
        const response = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price: 80.0 }),
        });
        const json = await response.json();
        expect(response.status).toBe(200);
        expect(json.price).toBe("80");
      },
    });
  });

  it("DELETE /api/services/:id - should delete a service", async () => {
    await testApiHandler({
      appHandler: serviceDetailHandler,
      params: { id: serviceId },
      test: async ({ fetch }) => {
        const response = await fetch({ method: "DELETE" });
        expect(response.status).toBe(204);
      },
    });

    const deletedService = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    expect(deletedService).toBeNull();
  });
});
