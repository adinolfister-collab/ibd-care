import { base44 } from '@/api/base44Client';

// Consolidated account deletion: clears every user-owned health entity, then
// removes the User authentication entity. RLS scopes each deleteMany to the
// caller's own rows. Throws if the User entity cannot be deleted so the caller
// can surface an error; in that case the health data has already been cleared.
export async function deleteAccountAndData(userId) {
  await Promise.all([
    base44.entities.SymptomEntry.deleteMany({}),
    base44.entities.FoodEntry.deleteMany({}),
    base44.entities.Medication.deleteMany({}),
    base44.entities.MedicalRecord.deleteMany({}),
    base44.entities.MealTemplate.deleteMany({}),
    base44.entities.ClinicalIndexEntry.deleteMany({}),
    base44.entities.FoodTriggerTag.deleteMany({}),
    base44.entities.MedicationDose.deleteMany({}),
  ]);
  if (userId) {
    await base44.entities.User.delete(userId);
  }
}