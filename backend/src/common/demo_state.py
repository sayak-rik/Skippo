from __future__ import annotations

from copy import deepcopy


def _base_state() -> dict:
    return {
        "users": {
            "parent": {
                "role": "parent",
                "token": "demo-parent-token",
                "name": "Aarav's Parent",
                "school_slug": "greenfield-public-school",
            },
            "driver": {
                "role": "driver",
                "token": "demo-driver-token",
                "name": "Rohit Kumar",
                "school_slug": "greenfield-public-school",
            },
            "teacher": {
                "role": "teacher",
                "token": "demo-teacher-token",
                "name": "Ms. Sen",
                "school_slug": "greenfield-public-school",
            },
        },
        "student": {
            "id": 1,
            "name": "Aarav Roy",
            "grade": "Class 4B",
            "routeName": "North Route A",
            "stopName": "Lakeview Stop",
        },
        "trip": {
            "id": 201,
            "routeName": "North Route A",
            "busLabel": "Bus 12",
            "vehicleLabel": "Bus 12",
            "shift": "morning",
            "status": "scheduled",
            "tripState": "scheduled",
            "etaMinutes": 8,
            "boardedCount": 1,
            "totalCount": 4,
            "nextStop": "Lakeview Stop",
            "busLocation": {
                "latitude": 22.5726,
                "longitude": 88.3639,
                "speed": 24,
                "heading": 140,
                "updatedAt": "2026-04-13T10:15:00+05:30",
            },
        },
        "vehicle": {
            "id": 1,
            "registrationNumber": "WB-04-AB-1288",
            "label": "Bus 12",
            "routeName": "North Route A",
            "capacity": 42,
        },
        "students": [
            {"id": 1, "name": "Aarav Roy", "stopName": "Lakeview Stop", "status": "boarded"},
            {"id": 2, "name": "Mira Dutta", "stopName": "Pine Street", "status": "boarded"},
            {"id": 3, "name": "Ved Singh", "stopName": "Metro Corner", "status": "dropped"},
            {"id": 4, "name": "Sia Das", "stopName": "City Center", "status": "absent"},
        ],
        "renewals": [
            {"id": 1, "title": "Vehicle fitness certificate", "expiresOn": "2026-04-20", "priority": "urgent"},
            {"id": 2, "title": "Pollution certificate", "expiresOn": "2026-05-07", "priority": "normal"},
            {"id": 3, "title": "Insurance renewal", "expiresOn": "2026-05-15", "priority": "normal"},
        ],
        "devices": [
            {"id": 1, "label": "Samsung A54", "platform": "Android", "isCurrent": True},
            {"id": 2, "label": "School Backup Phone", "platform": "Android", "isCurrent": False},
        ],
        "messages": [
            {
                "id": 1,
                "title": "Summer activity registrations open",
                "body": "Parents can now enroll students in the school summer activity camp from the message center.",
                "tag": "Update",
                "createdAt": "2026-04-12T09:30:00+05:30",
                "isRead": False,
            },
            {
                "id": 2,
                "title": "Partner offer: school supplies",
                "body": "Discounted notebooks and art kits are available this week through the school partner store.",
                "tag": "Offer",
                "createdAt": "2026-04-10T12:00:00+05:30",
                "isRead": True,
            },
        ],
        "alerts": [
            {
                "id": 1,
                "title": "Bus is 2 stops away",
                "body": "Bus 12 is approaching Lakeview Stop.",
                "level": "info",
                "createdAt": "2026-04-13T10:10:00+05:30",
            },
            {
                "id": 2,
                "title": "Student boarded safely",
                "body": "Aarav boarded Bus 12 at 7:42 AM.",
                "level": "info",
                "createdAt": "2026-04-13T07:42:00+05:30",
            },
        ],
        "progress": [
            {
                "id": 1,
                "title": "Strong reading progress",
                "note": "Completed the weekly reading task confidently and helped peers during discussion.",
                "category": "Academic",
                "createdAt": "2026-04-12T14:00:00+05:30",
                "isReadByParent": False,
            },
            {
                "id": 2,
                "title": "Great class participation",
                "note": "Volunteered answers in science and stayed engaged through the full session.",
                "category": "Participation",
                "createdAt": "2026-04-11T11:30:00+05:30",
                "isReadByParent": True,
            },
        ],
        "dailyReports": [
            {
                "id": 1,
                "date": "2026-04-13",
                "attendanceSummary": "Present across all scheduled classes. Marked active in school during first class and school concluded during final class.",
                "teacherCommentSummary": "2 teacher notes were added today, including reading confidence and science participation.",
                "unreadCommentCount": 1,
            }
        ],
        "schedule": [
            {
                "id": 1,
                "classroomLabel": "Class 4B",
                "title": "Morning Attendance",
                "startsAt": "08:00",
                "endsAt": "08:30",
                "isCurrent": True,
                "attendanceBoundary": "school_entry",
            },
            {
                "id": 2,
                "classroomLabel": "Class 4B",
                "title": "Science",
                "startsAt": "10:00",
                "endsAt": "10:45",
                "isCurrent": False,
                "attendanceBoundary": "none",
            },
            {
                "id": 3,
                "classroomLabel": "Class 4B",
                "title": "Closing Period",
                "startsAt": "14:45",
                "endsAt": "15:10",
                "isCurrent": False,
                "attendanceBoundary": "school_exit",
            },
        ],
        "roster": [
            {"id": 1, "fullName": "Aarav Roy", "rollNumber": "04", "isPresent": False, "latestComment": ""},
            {"id": 2, "fullName": "Mira Dutta", "rollNumber": "07", "isPresent": False, "latestComment": ""},
            {"id": 3, "fullName": "Ved Singh", "rollNumber": "11", "isPresent": False, "latestComment": ""},
            {"id": 4, "fullName": "Sia Das", "rollNumber": "18", "isPresent": False, "latestComment": ""},
        ],
        "teacherDailyPreview": [
            {
                "studentName": "Aarav Roy",
                "unreadCommentCount": 1,
                "summary": "Present across the day. Two teacher comments were added; one is still unread by the parent.",
            },
            {
                "studentName": "Mira Dutta",
                "unreadCommentCount": 0,
                "summary": "Present across the day. No unread teacher comments remaining.",
            },
        ],
        "sosEvents": [],
    }


STATE = _base_state()


def reset_demo_state() -> dict:
    global STATE
    STATE = _base_state()
    return STATE


def get_state() -> dict:
    return STATE


def login_payload(role: str) -> dict:
    return deepcopy(STATE["users"][role])


def parent_dashboard() -> dict:
    return {
        "student": deepcopy(STATE["student"]),
        "trip": {
            "id": STATE["trip"]["id"],
            "routeName": STATE["trip"]["routeName"],
            "busLabel": STATE["trip"]["busLabel"],
            "etaMinutes": STATE["trip"]["etaMinutes"],
            "status": STATE["trip"]["status"],
            "busLocation": deepcopy(STATE["trip"]["busLocation"]),
        },
        "progress": deepcopy(STATE["progress"]),
        "dailyReports": deepcopy(STATE["dailyReports"]),
        "messages": deepcopy(STATE["messages"]),
        "alerts": deepcopy(STATE["alerts"]),
    }


def driver_dashboard() -> dict:
    return {
        "vehicle": deepcopy(STATE["vehicle"]),
        "trip": deepcopy(STATE["trip"]),
        "students": deepcopy(STATE["students"]),
        "renewals": deepcopy(STATE["renewals"]),
        "devices": deepcopy(STATE["devices"]),
    }


def teacher_dashboard() -> dict:
    roster = sorted(STATE["roster"], key=lambda item: item["isPresent"])
    return {
        "schedule": deepcopy(sorted(STATE["schedule"], key=lambda item: (not item["isCurrent"], item["startsAt"]))),
        "roster": deepcopy(roster),
        "dailyPreview": deepcopy(STATE["teacherDailyPreview"]),
    }


def tracking_trip(trip_id: int) -> dict | None:
    if STATE["trip"]["id"] != trip_id:
        return None
    return {
        "id": STATE["trip"]["id"],
        "school_id": 1,
        "route_id": 1,
        "route_name": STATE["trip"]["routeName"],
        "vehicle_id": STATE["vehicle"]["id"],
        "vehicle_registration_number": STATE["vehicle"]["registrationNumber"],
        "driver_id": 1,
        "driver_username": STATE["users"]["driver"]["name"],
        "status": STATE["trip"]["status"],
        "started_at": "2026-04-13T07:30:00+05:30" if STATE["trip"]["status"] != "scheduled" else None,
        "ended_at": "2026-04-13T08:45:00+05:30" if STATE["trip"]["status"] == "completed" else None,
        "latest_location": {
            "id": 1,
            "trip_id": STATE["trip"]["id"],
            "latitude": STATE["trip"]["busLocation"]["latitude"],
            "longitude": STATE["trip"]["busLocation"]["longitude"],
            "speed": STATE["trip"]["busLocation"]["speed"],
            "heading": STATE["trip"]["busLocation"]["heading"],
            "accuracy": 8.5,
            "provider": "google_maps",
            "created_at": STATE["trip"]["busLocation"]["updatedAt"],
        },
    }


def tracking_fleet() -> list[dict]:
    trip = tracking_trip(STATE["trip"]["id"])
    return [trip] if trip and STATE["trip"]["status"] in {"active", "arriving"} else []


def start_trip(trip_id: int) -> dict | None:
    if STATE["trip"]["id"] != trip_id:
        return None
    STATE["trip"]["status"] = "active"
    STATE["trip"]["tripState"] = "active"
    return deepcopy(STATE["trip"])


def end_trip(trip_id: int) -> dict | None:
    if STATE["trip"]["id"] != trip_id:
        return None
    STATE["trip"]["status"] = "completed"
    STATE["trip"]["tripState"] = "completed"
    return deepcopy(STATE["trip"])


def board_student(student_id: int) -> dict | None:
    for student in STATE["students"]:
        if student["id"] == student_id:
            student["status"] = "boarded"
            STATE["trip"]["boardedCount"] = sum(1 for item in STATE["students"] if item["status"] in {"boarded", "dropped"})
            return deepcopy(student)
    return None


def drop_student(student_id: int) -> dict | None:
    for student in STATE["students"]:
        if student["id"] == student_id:
            student["status"] = "dropped"
            return deepcopy(student)
    return None


def trigger_sos() -> dict:
    event = {
        "id": len(STATE["sosEvents"]) + 1,
        "status": "open",
        "tripId": STATE["trip"]["id"],
    }
    STATE["sosEvents"].append(event)
    STATE["alerts"].insert(
        0,
        {
            "id": 100 + event["id"],
            "title": "Emergency alert triggered",
            "body": "SOS was triggered for the active route. School and parents were notified.",
            "level": "critical",
            "createdAt": "2026-04-13T12:40:00+05:30",
        },
    )
    return deepcopy(event)


def mark_attendance(session_id: int, student_id: int) -> dict | None:
    session = next((item for item in STATE["schedule"] if item["id"] == session_id), None)
    student = next((item for item in STATE["roster"] if item["id"] == student_id), None)
    if not session or not student:
        return None
    student["isPresent"] = True
    alert_hint = None
    if session["attendanceBoundary"] == "school_entry":
        alert_hint = "school_started"
        STATE["alerts"].insert(
            0,
            {
                "id": 300 + student_id,
                "title": "Student active in school",
                "body": f"{student['fullName']} was marked active in school during the first class.",
                "level": "info",
                "createdAt": "2026-04-13T08:05:00+05:30",
            },
        )
    elif session["attendanceBoundary"] == "school_exit":
        alert_hint = "school_concluded"
        STATE["alerts"].insert(
            0,
            {
                "id": 400 + student_id,
                "title": "School day concluded",
                "body": f"{student['fullName']} was marked school concluded in the final class.",
                "level": "info",
                "createdAt": "2026-04-13T15:10:00+05:30",
            },
        )
    return {"studentId": student_id, "event_type": session["attendanceBoundary"], "alert_hint": alert_hint}


def add_comment(session_id: int, student_id: int, note: str, category: str = "teacher_comment") -> dict | None:
    session = next((item for item in STATE["schedule"] if item["id"] == session_id), None)
    student = next((item for item in STATE["roster"] if item["id"] == student_id), None)
    if not session or not student:
        return None
    item = {
        "id": len(STATE["progress"]) + 1,
        "student_id": student_id,
        "classroom_id": 1,
        "session_id": session_id,
        "title": f"Teacher note for {student['fullName']}",
        "category": category,
        "note": note,
        "isReadByParent": False,
        "createdAt": "2026-04-13T12:00:00+05:30",
    }
    STATE["progress"].insert(0, item)
    student["latestComment"] = note
    STATE["dailyReports"][0]["teacherCommentSummary"] = f"{len(STATE['progress'])} teacher notes are available for today."
    STATE["dailyReports"][0]["unreadCommentCount"] = len([entry for entry in STATE["progress"] if not entry["isReadByParent"]])
    for preview in STATE["teacherDailyPreview"]:
        if preview["studentName"] == student["fullName"]:
            preview["unreadCommentCount"] += 1
            preview["summary"] = f"Present across the day. {preview['unreadCommentCount']} teacher comment(s) are still unread by the parent."
            break
    return deepcopy(item)


def parent_report(student_id: int) -> dict:
    unread = [item for item in STATE["progress"] if item["student_id"] == student_id and not item["isReadByParent"]]
    return {
        "unread_comment_count": len(unread),
        "unread_comments_preview": deepcopy(unread[:3]),
        "daily_reports": deepcopy(STATE["dailyReports"][:7]),
    }
