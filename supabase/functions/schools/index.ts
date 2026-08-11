import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_KEY = Deno.env.get("SCHOOL_ADMIN_KEY") || "";
const SARAS_SOURCE_URL = "https://cbse-schools.netlify.app/api/schools";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,PUT,OPTIONS", "Access-Control-Allow-Headers": "Authorization,Content-Type,apikey" };

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
}
function err(m: string, s = 400) { return json({ detail: m }, s); }

async function authUser(req: Request): Promise<{ id: string; email?: string; accountType?: string } | null> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  const u = data?.user;
  if (!u) return null;
  return { id: u.id, email: u.email ?? undefined, accountType: (u.user_metadata?.account_type as string) || undefined };
}

async function isAdmin(req: Request): Promise<boolean> {
  if (ADMIN_KEY) {
    const h = req.headers.get("X-API-Key") || req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
    if (h === ADMIN_KEY) return true;
  }
  const user = await authUser(req);
  if (user && (user.accountType === "institution" || user.accountType === "teacher")) return true;
  return !ADMIN_KEY;
}

async function isOwner(req: Request, schoolId: string): Promise<boolean> {
  if (ADMIN_KEY) {
    const h = req.headers.get("X-API-Key") || req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
    if (h === ADMIN_KEY) return true;
  }
  const user = await authUser(req);
  if (!user) return !ADMIN_KEY;
  const { data: school } = await supabase.from("schools").select("owner_id").eq("id", schoolId).maybeSingle();
  if (!school) return true;
  if (school.owner_id === user.id) return true;
  if (school.owner_id == null && user.accountType === "institution") return true;
  return false;
}

function shortCode(name: string, udise: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "SCH";
  const digits = (udise || "").slice(-4) || (Math.floor(1000 + Math.random() * 9000)).toString();
  return `${letters}${digits}`;
}

function teacherCode(schoolCode: string, subjectHint: string, n: number): string {
  const subj = (subjectHint || "T").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "GEN";
  return `${schoolCode}-${subj}-${String(n).padStart(4, "0")}`;
}

async function nextTeacherSeq(schoolId: string): Promise<number> {
  const { count } = await supabase
    .from("school_teachers")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);
  return (count || 0) + 1;
}

async function syncSectionCount(sectionId: string | null): Promise<void> {
  if (!sectionId) return;
  const { count } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("section_id", sectionId)
    .eq("is_active", true);
  await supabase.from("class_sections").update({ student_count: count || 0 }).eq("id", sectionId);
}

const LEVEL_MAP: Record<string, string> = {
  "Middle Class": "Middle School",
  "Secondary Level": "Secondary School",
  "Senior Secondary Level": "Senior Secondary School",
};

function s(v: unknown): string { return typeof v === "string" ? v.trim() : ""; }

async function importSaras(sourceUrl?: string): Promise<{ attempted: number; inserted: number; failed: number; error?: string }> {
  const url = sourceUrl || SARAS_SOURCE_URL;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error("Source fetch failed: " + res.status);
  const payload = await res.json();
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  if (!rows.length) throw new Error("No school rows in source payload");

  let inserted = 0, failed = 0;
  const batch: Record<string, unknown>[] = [];
  const flush = async () => {
    if (!batch.length) return;
    const { error } = await supabase.from("schools").upsert(batch, { onConflict: "cbse_affiliation_no" });
    if (error) failed += batch.length; else inserted += batch.length;
    batch.length = 0;
  };

  for (const r of rows) {
    const aff = s(r.affNo);
    if (!aff) continue;
    const name = s(r.schoolName);
    if (!name) continue;
    batch.push({
      name,
      cbse_affiliation_no: aff,
      cbse_exam_code: s(r.schCode) || null,
      short_code: "S" + aff,
      school_type: LEVEL_MAP[s(r.status)] || null,
      board: "CBSE",
      address: s(r.address) || null,
      city: s(r.district) || null,
      district: s(r.district) || null,
      state: s(r.state) || null,
      website: s(r.website) || null,
      principal_name: s(r.headName) || null,
      affiliation_status: "granted",
      source: "saras",
    });
    if (batch.length >= 500) await flush();
  }
  await flush();
  return { attempted: rows.length, inserted, failed };
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/[^\/]+\/?/, "").replace(/\/+$/, "");
  const method = req.method;
  const paths = path.split("/").filter(Boolean);

  try {
    if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

    // ----- /schools collection (path is empty after slug strip) -----
    if (paths.length === 0) {
      if (method === "GET") {
        const q = url.searchParams.get("q") || "";
        const state = url.searchParams.get("state") || "";
        const city = url.searchParams.get("city") || "";
        const board = url.searchParams.get("board") || "";
        const udise = url.searchParams.get("udise") || "";
        const affiliation = url.searchParams.get("affiliation") || "";
        const ownerEmail = url.searchParams.get("owner_email") || "";
        const ownerId = url.searchParams.get("owner_id") || "";
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
        const size = Math.min(100, Math.max(1, parseInt(url.searchParams.get("size") || "20")));

        let query = supabase.from("schools").select("*", { count: "exact" });
        if (q) query = query.or(`name.ilike.%${q}%,short_code.ilike.%${q}%,city.ilike.%${q}%,district.ilike.%${q}%`);
        if (state) query = query.eq("state", state);
        if (city) query = query.eq("city", city);
        if (board) query = query.eq("board", board);
        if (udise) query = query.eq("udise_code", udise);
        if (affiliation) query = query.eq("cbse_affiliation_no", affiliation);
        if (ownerEmail) query = query.eq("owner_email", ownerEmail);
        if (ownerId) query = query.eq("owner_id", ownerId);
        const { data, count, error } = await query.order("name").range((page - 1) * size, page * size - 1);
        if (error) return err(error.message, 500);
        return json({ data: data || [], count: count || 0, page, size });
      }

      if (method === "POST") {
        if (!(await isAdmin(req))) return err("Unauthorized", 401);
        const b = await req.json();
        if (!b?.name) return err("name required", 400);
        const user = await authUser(req);
        const { data, error } = await supabase.from("schools").insert({
          name: b.name,
          owner_id: user?.id ?? null,
          owner_email: user?.email ?? (b.owner_email || null),
          udise_code: b.udise_code || null,
          cbse_affiliation_no: b.cbse_affiliation_no || null,
          cbse_exam_code: b.cbse_exam_code || null,
          short_code: b.short_code || shortCode(b.name, b.udise_code || ""),
          school_type: b.school_type || null,
          management: b.management || null,
          board: b.board || null,
          medium: b.medium || null,
          affiliation_status: b.affiliation_status || "pending",
          address: b.address || null,
          city: b.city || null,
          district: b.district || null,
          state: b.state || null,
          pincode: b.pincode || null,
          phone: b.phone || null,
          email: b.email || null,
          website: b.website || null,
          principal_name: b.principal_name || null,
          source: b.source || "manual",
        }).select().single();
        if (error) return err(error.message, 409);
        return json({ data }, 201);
      }
      return err("Method not allowed", 405);
    }

    // ----- /import -----
    if (paths.length === 1 && paths[0] === "import") {
      if (method !== "POST") return err("Method not allowed", 405);
      if (!(await isAdmin(req))) return err("Unauthorized", 401);
      const b = await req.json().catch(() => ({}));
      const stats = await importSaras(b?.url || undefined);
      return json({ data: stats });
    }

    // ----- /schools/:id -----
    if (paths.length >= 1) {
      const id = paths[0];

      if (paths.length === 1) {
        if (method === "POST") {
          const user = await authUser(req);
          if (!user || (user.accountType !== "institution" && user.accountType !== "teacher")) {
            return err("Sign in with an institution or teacher account to claim a school", 401);
          }
          const { data: cur } = await supabase.from("schools").select("owner_id").eq("id", id).maybeSingle();
          if (!cur) return err("School not found", 404);
          if (cur.owner_id && cur.owner_id !== user.id) return err("This school is already claimed by another account", 409);
          if (cur.owner_id === user.id) return json({ data: { id, already_owner: true } });
          const { data, error } = await supabase.from("schools")
            .update({ owner_id: user.id, owner_email: user.email ?? null })
            .eq("id", id).select().single();
          if (error) return err(error.message, 400);
          return json({ data, already_owner: false });
        }
        if (method === "GET") {
          const { data, error } = await supabase.from("schools").select("*").eq("id", id).single();
          if (error) return err("School not found", 404);
          const { data: settings } = await supabase.from("school_settings").select("*").eq("school_id", id).maybeSingle();
          const { data: teachers } = await supabase.from("school_teachers").select("*").eq("school_id", id).order("created_at", { ascending: false });
          const { data: classes } = await supabase.from("school_classes").select("*").eq("school_id", id).order("created_at", { ascending: true });
          const classIds = (classes || []).map((c) => c.id);
          const { data: sections } = classIds.length
            ? await supabase.from("class_sections").select("*").in("class_id", classIds).order("created_at", { ascending: true })
            : { data: [] };
          const { data: students } = await supabase.from("students").select("*").eq("school_id", id).order("name", { ascending: true });
          const studentList = students || [];
          const mergedClasses = (classes || []).map((c) => ({
            ...c,
            sections: (sections || [])
              .filter((s) => s.class_id === c.id)
              .map((s) => ({
                ...s,
                students: studentList.filter((st) => st.section_id === s.id),
              })),
          }));
          return json({
            ...data,
            settings: settings || null,
            teacher_count: (teachers || []).length,
            student_count: studentList.filter((st) => st.is_active).length,
            teachers: teachers || [],
            classes: mergedClasses,
          });
        }
        if (method === "PATCH") {
          if (!(await isOwner(req, id))) return err("Unauthorized", 401);
          const b = await req.json();
          const allowed = ["name", "udise_code", "cbse_affiliation_no", "cbse_exam_code", "school_type", "management", "board", "medium", "affiliation_status", "address", "city", "district", "state", "pincode", "phone", "email", "website", "principal_name", "is_active"];
          const patch: Record<string, unknown> = {};
          for (const k of allowed) if (k in b) patch[k] = b[k];
          if (!Object.keys(patch).length) return err("nothing to update", 400);
          const { data, error } = await supabase.from("schools").update(patch).eq("id", id).select().single();
          if (error) return err(error.message, 400);
          return json({ data });
        }
        if (method === "DELETE") {
          if (!(await isOwner(req, id))) return err("Unauthorized", 401);
          const { error } = await supabase.from("schools").update({ is_active: false }).eq("id", id);
          if (error) return err(error.message, 400);
          return json({ data: { id } });
        }
        return err("Method not allowed", 405);
      }

      // ----- /schools/:id/teachers -----
      if (paths[1] === "teachers") {
        if (paths.length === 2) {
          if (method === "GET") {
            const { data, error } = await supabase.from("school_teachers").select("*").eq("school_id", id).order("created_at", { ascending: false });
            if (error) return err(error.message, 500);
            return json({ data: data || [] });
          }
          if (method === "POST") {
            if (!(await isOwner(req, id))) return err("Unauthorized", 401);
            const b = await req.json();
            if (!b?.name) return err("name required", 400);
            const { data: school } = await supabase.from("schools").select("short_code, udise_code").eq("id", id).single();
            if (!school) return err("School not found", 404);
            const schoolCode = school.short_code || (school.udise_code || "SCH").slice(-4);
            const seq = await nextTeacherSeq(id);
            const code = teacherCode(schoolCode, b.subject || b.subjects?.[0] || "T", seq);
            const { data, error } = await supabase.from("school_teachers").insert({
              school_id: id,
              teacher_code: code,
              name: b.name,
              email: b.email || null,
              phone: b.phone || null,
              designation: b.designation || "Teacher",
              subjects: b.subjects || null,
              qualification: b.qualification || null,
              joining_date: b.joining_date || null,
              status: b.status || "active",
            }).select().single();
            if (error) return err(error.message, 409);
            return json({ data }, 201);
          }
          return err("Method not allowed", 405);
        }
        if (paths.length === 3) {
          const teacherId = paths[2];
          if (method === "GET") {
            const { data, error } = await supabase.from("school_teachers").select("*").eq("id", teacherId).eq("school_id", id).maybeSingle();
            if (error) return err(error.message, 500);
            if (!data) return err("Teacher not found", 404);
            return json({ data });
          }
          if (method === "PATCH") {
            if (!(await isOwner(req, id))) return err("Unauthorized", 401);
            const b = await req.json();
            const allowed = ["name", "email", "phone", "designation", "subjects", "qualification", "joining_date", "status"];
            const patch: Record<string, unknown> = {};
            for (const k of allowed) if (k in b) patch[k] = b[k] ?? null;
            if (!Object.keys(patch).length) return err("nothing to update", 400);
            const { data, error } = await supabase.from("school_teachers").update(patch).eq("id", teacherId).eq("school_id", id).select().single();
            if (error) return err(error.message, 400);
            return json({ data });
          }
          if (method === "DELETE") {
            if (!(await isOwner(req, id))) return err("Unauthorized", 401);
            const { error } = await supabase.from("school_teachers").update({ status: "inactive" }).eq("id", teacherId).eq("school_id", id);
            if (error) return err(error.message, 400);
            return json({ data: { id: teacherId } });
          }
          return err("Method not allowed", 405);
        }
        return err("Method not allowed", 405);
      }

      // ----- /schools/:id/students -----
      if (paths[1] === "students") {
        if (paths.length === 2) {
          if (method === "GET") {
            const classId = url.searchParams.get("class_id") || "";
            const sectionId = url.searchParams.get("section_id") || "";
            const q = url.searchParams.get("q") || "";
            const status = url.searchParams.get("status") || "";
            const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
            const size = Math.min(100, Math.max(1, parseInt(url.searchParams.get("size") || "20")));
            let query = supabase.from("students").select("*", { count: "exact" }).eq("school_id", id);
            if (classId) query = query.eq("class_id", classId);
            if (sectionId) query = query.eq("section_id", sectionId);
            if (status) query = query.eq("status", status);
            if (q) query = query.or(`name.ilike.%${q}%,roll_no.ilike.%${q}%,admission_no.ilike.%${q}%`);
            const { data, count, error } = await query.order("name").range((page - 1) * size, page * size - 1);
            if (error) return err(error.message, 500);
            return json({ data: data || [], count: count || 0, page, size });
          }
          if (method === "POST") {
            if (!(await isOwner(req, id))) return err("Unauthorized", 401);
            const b = await req.json();
            if (!b?.name) return err("name required", 400);
            if (!b.class_id && !b.section_id) return err("class_id or section_id required", 400);
            const classId = b.class_id || null;
            const { data: cls } = classId
              ? await supabase.from("school_classes").select("id").eq("id", String(classId)).eq("school_id", id).maybeSingle()
              : { data: null };
            if (classId && !cls) return err("Class not found in this school", 400);
            const sectionId = b.section_id ? String(b.section_id) : null;
            if (sectionId) {
              const { data: sec } = await supabase
                .from("class_sections").select("id").eq("id", sectionId).eq("class_id", classId || cls?.id || "").maybeSingle();
              if (!sec) return err("Section not found in this class", 400);
            }
            let roll = s(b.roll_no);
            if (!roll && sectionId) {
              const { count } = await supabase.from("students")
                .select("id", { count: "exact", head: true }).eq("section_id", sectionId).eq("is_active", true);
              roll = String((count || 0) + 1);
            }
            const { data, error } = await supabase.from("students").insert({
              school_id: id,
              class_id: classId || cls?.id || null,
              section_id: sectionId,
              admission_no: s(b.admission_no) || null,
              roll_no: roll || null,
              name: String(b.name).trim(),
              gender: b.gender || null,
              date_of_birth: b.date_of_birth || null,
              admission_date: b.admission_date || null,
              father_name: b.father_name || null,
              mother_name: b.mother_name || null,
              phone: b.phone || null,
              address: b.address || null,
              status: b.status || "active",
              is_active: b.is_active ?? true,
            }).select().single();
            if (error) return err(error.message, 409);
            await syncSectionCount(sectionId);
            return json({ data }, 201);
          }
          return err("Method not allowed", 405);
        }

        const studentId = paths[2];
        if (paths.length === 3) {
          if (method === "GET") {
            const { data, error } = await supabase.from("students").select("*").eq("id", studentId).eq("school_id", id).maybeSingle();
            if (error) return err(error.message, 500);
            if (!data) return err("Student not found", 404);
            return json({ data });
          }
          if (method === "PATCH") {
            if (!(await isOwner(req, id))) return err("Unauthorized", 401);
            const b = await req.json();
            const { data: cur, error: curErr } = await supabase
              .from("students").select("section_id, class_id").eq("id", studentId).eq("school_id", id).maybeSingle();
            if (curErr) return err(curErr.message, 500);
            if (!cur) return err("Student not found", 404);
            const newClassId = b.class_id !== undefined ? (b.class_id ? String(b.class_id) : null) : cur.class_id;
            const newSectionId = b.section_id !== undefined ? (b.section_id ? String(b.section_id) : null) : cur.section_id;
            if (newClassId) {
              const { data: cls } = await supabase.from("school_classes").select("id").eq("id", newClassId).eq("school_id", id).maybeSingle();
              if (!cls) return err("Class not found in this school", 400);
            }
            if (newSectionId) {
              const { data: sec } = await supabase
                .from("class_sections").select("id").eq("id", newSectionId).eq("class_id", newClassId || "").maybeSingle();
              if (!sec) return err("Section not found in this class", 400);
            }
            const patch: Record<string, unknown> = {
              ...(b.name !== undefined && { name: String(b.name).trim() }),
              ...(b.admission_no !== undefined && { admission_no: b.admission_no ? String(b.admission_no) : null }),
              ...(b.roll_no !== undefined && { roll_no: b.roll_no ? String(b.roll_no) : null }),
              ...(b.gender !== undefined && { gender: b.gender ? String(b.gender) : null }),
              ...(b.date_of_birth !== undefined && { date_of_birth: b.date_of_birth || null }),
              ...(b.admission_date !== undefined && { admission_date: b.admission_date || null }),
              ...(b.father_name !== undefined && { father_name: b.father_name ? String(b.father_name) : null }),
              ...(b.mother_name !== undefined && { mother_name: b.mother_name ? String(b.mother_name) : null }),
              ...(b.phone !== undefined && { phone: b.phone ? String(b.phone) : null }),
              ...(b.address !== undefined && { address: b.address ? String(b.address) : null }),
              ...(b.status !== undefined && { status: String(b.status) }),
              ...(b.is_active !== undefined && { is_active: !!b.is_active }),
              ...(b.class_id !== undefined && { class_id: newClassId }),
              ...(b.section_id !== undefined && { section_id: newSectionId }),
            };
            if (!Object.keys(patch).length) return err("nothing to update", 400);
            const { data, error } = await supabase.from("students").update(patch).eq("id", studentId).eq("school_id", id).select().single();
            if (error) return err(error.message, 400);
            if (cur.section_id !== newSectionId) {
              await syncSectionCount(cur.section_id);
              await syncSectionCount(newSectionId);
            }
            return json({ data });
          }
          if (method === "DELETE") {
            if (!(await isOwner(req, id))) return err("Unauthorized", 401);
            const { data: cur, error: curErr } = await supabase
              .from("students").select("section_id").eq("id", studentId).eq("school_id", id).maybeSingle();
            if (curErr) return err(curErr.message, 500);
            if (!cur) return err("Student not found", 404);
            const { error } = await supabase.from("students").update({ is_active: false }).eq("id", studentId).eq("school_id", id);
            if (error) return err(error.message, 400);
            await syncSectionCount(cur.section_id);
            return json({ data: { id: studentId } });
          }
          return err("Method not allowed", 405);
        }
        return err("Not found", 404);
      }

      // ----- /schools/:id/settings -----
      if (paths[1] === "settings") {
        if (method === "GET") {
          const { data, error } = await supabase.from("school_settings").select("*").eq("school_id", id).maybeSingle();
          if (error) return err(error.message, 500);
          return json({ data });
        }
        if (method === "PUT") {
          if (!(await isOwner(req, id))) return err("Unauthorized", 401);
          const b = await req.json();
          const patch: Record<string, unknown> = {};
          if (b.branding) patch.branding = b.branding;
          if (b.features) patch.features = b.features;
          if (b.curriculum) patch.curriculum = b.curriculum;
          if (!Object.keys(patch).length) return err("nothing to update", 400);
          const { data, error } = await supabase.from("school_settings")
            .upsert({ school_id: id, ...patch }, { onConflict: "school_id" })
            .select().single();
          if (error) return err(error.message, 400);
          return json({ data });
        }
        return err("Method not allowed", 405);
      }

      // ----- /schools/:id/classes -----
      if (paths[1] === "classes") {
        if (paths.length === 2) {
          if (method === "GET") {
            const { data: classes, error: ce } = await supabase
              .from("school_classes").select("*").eq("school_id", id)
              .order("created_at", { ascending: true });
            if (ce) return err(ce.message, 500);
            const classIds = (classes || []).map((c) => c.id);
            let sections: any[] = [];
            if (classIds.length) {
              const { data: sec, error: se } = await supabase
                .from("class_sections").select("*").in("class_id", classIds)
                .order("created_at", { ascending: true });
              if (se) return err(se.message, 500);
              sections = sec || [];
            }
            const merged = (classes || []).map((c) => ({
              ...c,
              sections: sections.filter((s) => s.class_id === c.id),
            }));
            return json({ data: merged });
          }
          if (method === "POST") {
            if (!(await isOwner(req, id))) return err("Unauthorized", 401);
            const b = await req.json();
            if (!b?.name) return err("name required", 400);
            const { data, error } = await supabase.from("school_classes").insert({
              school_id: id,
              name: String(b.name).trim(),
              class_teacher_id: b.class_teacher_id || null,
              is_active: b.is_active ?? true,
            }).select().single();
            if (error) return err(error.message, 409);
            return json({ data }, 201);
          }
          return err("Method not allowed", 405);
        }

        const classId = paths[2];
        if (paths.length === 3) {
          if (method === "GET") {
            const { data, error } = await supabase.from("school_classes").select("*").eq("id", classId).eq("school_id", id).maybeSingle();
            if (error) return err(error.message, 500);
            if (!data) return err("Class not found", 404);
            const { data: sections } = await supabase.from("class_sections").select("*").eq("class_id", classId).order("created_at", { ascending: true });
            return json({ ...data, sections: sections || [] });
          }
          if (method === "PATCH") {
            if (!(await isOwner(req, id))) return err("Unauthorized", 401);
            const b = await req.json();
            const patch: Record<string, unknown> = {};
            if (b.name !== undefined) patch.name = String(b.name).trim();
            if (b.class_teacher_id !== undefined) patch.class_teacher_id = b.class_teacher_id;
            if (b.is_active !== undefined) patch.is_active = b.is_active;
            if (!Object.keys(patch).length) return err("nothing to update", 400);
            const { data, error } = await supabase.from("school_classes").update(patch).eq("id", classId).eq("school_id", id).select().single();
            if (error) return err(error.message, 400);
            return json({ data });
          }
          if (method === "DELETE") {
            if (!(await isOwner(req, id))) return err("Unauthorized", 401);
            const { error } = await supabase.from("school_classes").update({ is_active: false }).eq("id", classId).eq("school_id", id);
            if (error) return err(error.message, 400);
            return json({ data: { id: classId } });
          }
          return err("Method not allowed", 405);
        }

        // ----- /schools/:id/classes/:classId/sections -----
        if (paths[3] === "sections") {
          if (paths.length === 4) {
            if (method === "POST") {
              if (!(await isOwner(req, id))) return err("Unauthorized", 401);
              const b = await req.json();
              if (!b?.name) return err("name required", 400);
              const count = Math.max(0, parseInt(b.student_count) || 0);
              const { data, error } = await supabase.from("class_sections").insert({
                class_id: classId,
                name: String(b.name).trim(),
                student_count: count,
                is_active: b.is_active ?? true,
              }).select().single();
              if (error) return err(error.message, 409);
              return json({ data }, 201);
            }
            return err("Method not allowed", 405);
          }

          const sectionId = paths[4];
          if (paths.length === 5) {
            if (method === "GET") {
              const { data, error } = await supabase.from("class_sections").select("*").eq("id", sectionId).eq("class_id", classId).maybeSingle();
              if (error) return err(error.message, 500);
              if (!data) return err("Section not found", 404);
              return json({ data });
            }
            if (method === "PATCH") {
              if (!(await isOwner(req, id))) return err("Unauthorized", 401);
              const b = await req.json();
              const patch: Record<string, unknown> = {};
              if (b.name !== undefined) patch.name = String(b.name).trim();
              if (b.student_count !== undefined) patch.student_count = Math.max(0, parseInt(b.student_count) || 0);
              if (b.is_active !== undefined) patch.is_active = b.is_active;
              if (!Object.keys(patch).length) return err("nothing to update", 400);
              const { data, error } = await supabase.from("class_sections").update(patch).eq("id", sectionId).eq("class_id", classId).select().single();
              if (error) return err(error.message, 400);
              return json({ data });
            }
            if (method === "DELETE") {
              if (!(await isOwner(req, id))) return err("Unauthorized", 401);
              const { error } = await supabase.from("class_sections").update({ is_active: false }).eq("id", sectionId).eq("class_id", classId);
              if (error) return err(error.message, 400);
              return json({ data: { id: sectionId } });
            }
            return err("Method not allowed", 405);
          }
        }
        return err("Not found", 404);
      }

      // ----- /schools/:id/sections (flat convenience list) -----
      if (paths.length === 2 && paths[1] === "sections") {
        if (method !== "GET") return err("Method not allowed", 405);
        const { data: classes } = await supabase.from("school_classes").select("id").eq("school_id", id);
        const classIds = (classes || []).map((c) => c.id);
        if (!classIds.length) return json({ data: [] });
        const { data, error } = await supabase.from("class_sections").select("*").in("class_id", classIds).order("created_at", { ascending: true });
        if (error) return err(error.message, 500);
        return json({ data: data || [] });
      }

      return err("Not found", 404);
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Internal server error", 500);
  }
});