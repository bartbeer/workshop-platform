import { requireApprovedTeacher } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function WorkshopsTeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireApprovedTeacher("/dashboard/workshops");
  return children;
}
