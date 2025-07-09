import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testApiHandler } from "next-test-api-route-handler";
import * as petsListHandler from "@/app/api/pets/route";
import * as petDetailHandler from "@/app/api/pets/[id]/route";
import { PrismaClient, PetSize } from "@prisma/client";

const prisma = new PrismaClient();

describe.sequential("Pets API", () => {
  let petId: string;
  let testClientId: string;

  beforeAll(async () => {
    await prisma.pet.deleteMany({});
    await prisma.client.deleteMany({});
    const client = await prisma.client.create({
      data: { name: "Dono de Pet Teste", phone: "21987654321" },
    });
    testClientId = client.id;
  });

  afterAll(async () => {
    await prisma.pet.deleteMany({});
    await prisma.client.deleteMany({});
  });

  it("POST /api/pets - should create a new pet", async () => {
    await testApiHandler({
      appHandler: petsListHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Bolinha",
            size: PetSize.PEQUENO,
            clientId: testClientId,
          }),
        });
        const json = await response.json();
        expect(response.status).toBe(201);
        expect(json).toHaveProperty("id");
        petId = json.id;
      },
    });
  });

  it("GET /api/pets - should list all pets", async () => {
    await testApiHandler({
      appHandler: petsListHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const json = await response.json();
        expect(response.status).toBe(200);
        expect(json.length).toBeGreaterThan(0);
        expect(json[0].client.name).toBe("Dono de Pet Teste");
      },
    });
  });

  it("DELETE /api/pets/:id - should delete a pet", async () => {
    await testApiHandler({
      appHandler: petDetailHandler,
      params: { id: petId },
      test: async ({ fetch }) => {
        const response = await fetch({ method: "DELETE" });
        expect(response.status).toBe(204);
      },
    });
  });
});
