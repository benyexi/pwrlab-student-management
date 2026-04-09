"""
Batch import students from Excel to Supabase.
Columns: name, student_id, enrollment_year, degree_type,
         research_direction, expected_graduation
Email/phone not in students table — skipped.
"""

import openpyxl
import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://yyqkagljovzhcebtncik.supabase.co"
SUPABASE_KEY = "sb_publishable_H5bGKdIo28HIM6k4hRQO1A_2nM2jqr8"
EXCEL_PATH = "/Users/sekimotono/Desktop/pwrlab-student-management/学生信息(1).xlsx"


def upsert_students(students: list[dict]) -> None:
    url = f"{SUPABASE_URL}/rest/v1/students"
    payload = json.dumps(students).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            print(f"✓ Upserted {len(data)} records")
            for s in data:
                print(f"  {s.get('name')} ({s.get('student_id')}) — {s.get('degree_type')}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"✗ HTTP {e.code}: {body}")


def main():
    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb.active

    students = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        name, student_id, email, phone, enroll_year, degree, direction, grad_year = row
        if not name:
            continue
        students.append({
            "name": str(name).strip(),
            "student_id": str(int(student_id)) if student_id else None,
            "enrollment_year": int(enroll_year) if enroll_year else None,
            "degree_type": str(degree).strip() if degree else None,
            "research_direction": str(direction).strip() if direction else None,
            "expected_graduation": str(int(grad_year)) if grad_year else None,
            "advisor": "席本野",
            "status": "在读",
        })

    print(f"Prepared {len(students)} students from Excel:")
    for s in students:
        print(f"  {s['name']} ({s['student_id']}) {s['degree_type']} {s['enrollment_year']}级")

    print(f"\nUpserting to Supabase...")
    upsert_students(students)


if __name__ == "__main__":
    main()
