import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testApiHandler } from "next-test-api-route-handler";
import * as clientsListHandler from "@/app/api/clients/route";
import * as clientDetailHandler from "@/app/api/clients/[id]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe.sequential("Clients API", () => {
  let clientId: string;

  beforeAll(async () => {
    await prisma.client.deleteMany({});
  });

  afterAll(async () => {
    await prisma.client.deleteMany({});
  });

  it("POST /api/clients - should create a new client", async () => {
    await testApiHandler({
      appHandler: clientsListHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Cliente de Teste",
            phone: "1234567890",
          }),
        });
        const json = await res.json();
        expect(res.status).toBe(201);
        expect(json).toHaveProperty("id");
        clientId = json.id;
      },
    });
  });

  it("GET /api/clients/:id - should get a specific client", async () => {
    await testApiHandler({
      appHandler: clientDetailHandler,
      params: { id: clientId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        const json = await res.json();
        expect(res.status).toBe(200);
        expect(json.name).toBe("Cliente de Teste");
      },
    });
  });
});
