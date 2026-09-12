import { FarmerForm } from "@/components/farmers/FarmerForm";

export default function NewFarmerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Add Farmer</h1>
      <FarmerForm />
    </div>
  );
}
