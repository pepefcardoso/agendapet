import { PetList } from "@/components/pets/PetList";

export default function PetsPage() {
  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestão de Pets</h1>
      </header>
      <PetList />
    </div>
  );
}
