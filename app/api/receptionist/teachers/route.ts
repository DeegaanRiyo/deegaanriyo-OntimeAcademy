import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();

    if (!["receptionist", "admin", "owner", "manager"].includes(caller?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all registrations that have teachers assigned
    const { data: rows, error } = await admin
      .from("student_registrations")
      .select("id, customer_name, customer_phone, student_type, course_name, teachers")
      .not("teachers", "is", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Aggregate: group students by teacher name
    type StudentRef = {
      id: string;
      name: string;
      phone: string;
      type: string;
      course: string | null;
      subject: string; // subject this teacher teaches this student
    };
    type TeacherMap = {
      name: string;
      subjects: Set<string>;
      students: StudentRef[];
    };

    const map = new Map<string, TeacherMap>();

    for (const row of rows ?? []) {
      const teachers = row.teachers as { name: string; subject: string }[] | null;
      if (!teachers) continue;
      for (const t of teachers) {
        const key = t.name.trim().toLowerCase();
        if (!key) continue;
        if (!map.has(key)) {
          map.set(key, { name: t.name.trim(), subjects: new Set(), students: [] });
        }
        const entry = map.get(key)!;
        if (t.subject) entry.subjects.add(t.subject.trim());
        entry.students.push({
          id:      row.id,
          name:    row.customer_name,
          phone:   row.customer_phone,
          type:    row.student_type,
          course:  row.course_name ?? null,
          subject: t.subject ?? "",
        });
      }
    }

    const teachers = Array.from(map.values()).map((t) => ({
      name:          t.name,
      subjects:      Array.from(t.subjects),
      student_count: t.students.length,
      students:      t.students,
    }));

    // Sort by student count desc
    teachers.sort((a, b) => b.student_count - a.student_count);

    return NextResponse.json({ teachers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
