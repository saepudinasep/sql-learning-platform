type ModuleLike = { id: string; accessLevel: "FREE" | "PRO" };
type CourseLike = { id: string; modules: ModuleLike[] };

/**
 * Course dianggap "selesai" kalau semua modul GRATIS di dalamnya sudah
 * completed. Modul PRO sengaja diabaikan dari perhitungan ini — soalnya
 * belum ada sistem subscription (Fase 6 ditunda), jadi modul PRO memang
 * tidak akan pernah bisa diselesaikan siapa pun untuk sekarang. Kalau modul
 * PRO ikut disyaratkan, course manapun yang punya modul PRO gak akan pernah
 * dianggap selesai, dan itu bakal mengunci semua course setelahnya
 * selamanya.
 */
export function isCourseFullyCompleted(
  course: CourseLike,
  isModuleCompleted: (moduleId: string) => boolean
): boolean {
  const freeModules = course.modules.filter((m) => m.accessLevel === "FREE");
  if (freeModules.length === 0) return true;
  return freeModules.every((m) => isModuleCompleted(m.id));
}

/**
 * Course ke-N terkunci kalau course ke-(N-1) belum selesai — sama seperti
 * logic buka-bertahap modul, tapi satu level di atasnya. Dihitung secara
 * cascading: kalau course ke-(N-1) sendiri sudah terkunci, course ke-N ikut
 * terkunci juga meski secara data kebetulan sudah "selesai".
 */
export function getLockedCourseIds(
  courses: CourseLike[],
  isModuleCompleted: (moduleId: string) => boolean
): Set<string> {
  const locked = new Set<string>();
  for (let i = 1; i < courses.length; i++) {
    const prevCourse = courses[i - 1];
    const prevComplete = isCourseFullyCompleted(prevCourse, isModuleCompleted);
    if (!prevComplete || locked.has(prevCourse.id)) {
      locked.add(courses[i].id);
    }
  }
  return locked;
}
