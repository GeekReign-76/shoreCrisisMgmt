#!/usr/bin/env python3
"""
Generate a client-ready PDF preview document with screenshots of the Shore Crisis Management web app.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

FILENAME = "Shore_Crisis_Management_Preview.pdf"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")

# Brand colors
DARK_BLUE = HexColor("#2A5F8F")
OCEAN_BLUE = HexColor("#3A7CB8")
LIGHT_BLUE = HexColor("#5AACE8")
GOLD = HexColor("#C49A4A")
BG_LIGHT = HexColor("#F0F6FA")
WHITE = HexColor("#FFFFFF")
DARK_TEXT = HexColor("#1E293B")
BODY_TEXT = HexColor("#475569")
LIGHT_TEXT = HexColor("#94A3B8")

PAGE_W, PAGE_H = letter
MARGIN = 0.6 * inch
CONTENT_W = PAGE_W - 2 * MARGIN

# Screenshots in order (oldest → newest = top → bottom of doc)
PAGES = [
    {
        "file": "login_bank.png",
        "title": "Login Page",
        "desc": "Secure login portal for clients and practice staff. Clean, professional design with the Shore Crisis Management branding.",
    },
    {
        "file": "login_owner.png",
        "title": "Owner Login",
        "desc": "The practice owner logs in with their credentials to access the full management dashboard.",
    },
    {
        "file": "owners_dashboard.png",
        "title": "Owner Dashboard",
        "desc": "At-a-glance view of today's appointments, pending requests, upcoming schedule, and completed sessions. Quick access to messages, clients, and reports.",
    },
    {
        "file": "services.png",
        "title": "Services Page",
        "desc": "Public-facing services page showcasing Individual Therapy, Child & Adolescent, Psychiatric Evaluation, Psychological Testing, and Crisis Intervention. Includes specialty areas and age groups served.",
    },
    {
        "file": "insurance.png",
        "title": "Insurance & Fees",
        "desc": "Displays all accepted insurance providers — Aetna, BlueCross BlueShield, Carolina Complete, Vaya Health, and Alliance Health — with coverage guidance.",
    },
    {
        "file": "crisis_resources.png",
        "title": "Crisis Resources",
        "desc": "Emergency resources page with 911 call button, 988 Suicide & Crisis Lifeline, Crisis Text Line, SAMHSA, Veterans Crisis Line, Trevor Project, and practice contact info.",
    },
    {
        "file": "contact_us.png",
        "title": "Contact / Intake Form",
        "desc": "HIPAA-aware intake form collecting client name, DOB, diagnosis, insurance, contact preference, and reason for reaching out. Submissions are emailed to the practice owner immediately.",
    },
    {
        "file": "clients.png",
        "title": "Client Directory",
        "desc": "Searchable list of all clients with contact info, insurance provider, appointment history, and last visit date. Click any client to access their full profile.",
    },
    {
        "file": "client_profile.png",
        "title": "Client Profile",
        "desc": "Complete client view including personal info, clinical profile (diagnosis codes, treatment goals, medications), session notes, message history, and appointment/billing history.",
    },
    {
        "file": "messages.png",
        "title": "Messages — Conversation List",
        "desc": "Real-time messaging system with all client conversations. Unread message badges, message previews, and instant delivery via WebSocket.",
    },
    {
        "file": "messages_details.png",
        "title": "Messages — Chat View",
        "desc": "Full conversation thread with a client. Supports typing indicators, read receipts, and push notifications when the recipient is offline.",
    },
    {
        "file": "reports.png",
        "title": "Reports — Appointment Analytics",
        "desc": "Appointment volume dashboard with monthly trends, busiest days, and busiest hours. Includes a toggle to view real data, test data, or both.",
    },
    {
        "file": "reports_client_activity.png",
        "title": "Reports — Client Activity",
        "desc": "Per-client activity overview showing appointment count, cancellations, messages, total fees, and last visit. Link to each client's full profile for deeper review.",
    },
]


def draw_page_number(c, page_num, total):
    c.setFont("Helvetica", 8)
    c.setFillColor(LIGHT_TEXT)
    c.drawCentredString(PAGE_W / 2, 0.35 * inch, f"Page {page_num} of {total}")


def build_pdf():
    c = canvas.Canvas(FILENAME, pagesize=letter)
    c.setTitle("Shore Crisis Management — Application Preview")

    total_pages = len(PAGES) + 1  # +1 for title page

    # ═══════════════════════════════════════════
    # TITLE PAGE
    # ═══════════════════════════════════════════
    # Background
    c.setFillColor(DARK_BLUE)
    c.rect(0, PAGE_H - 3.5 * inch, PAGE_W, 3.5 * inch, fill=1, stroke=0)

    # Logo
    logo_path = os.path.join(os.path.dirname(__file__), "..", "client", "public", "logo.png")
    if os.path.exists(logo_path):
        c.drawImage(logo_path, PAGE_W / 2 - 60, PAGE_H - 2.0 * inch, width=120, height=120, mask="auto")

    # Title text
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 2.5 * inch, "Shore Crisis Management")

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Oblique", 14)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 2.85 * inch, "Helping You Weather the Waves of Life")

    c.setFillColor(HexColor("#FFFFFFCC"))
    c.setFont("Helvetica", 11)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 3.2 * inch, "Web Application Preview")

    # Details section
    y = PAGE_H - 4.3 * inch

    c.setFillColor(DARK_TEXT)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN, y, "Prepared for:")
    c.setFont("Helvetica", 12)
    c.drawString(MARGIN + 1.5 * inch, y, "Tyrin Miller, CEO — Shore Crisis Management")

    y -= 0.35 * inch
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN, y, "Prepared by:")
    c.setFont("Helvetica", 12)
    c.drawString(MARGIN + 1.5 * inch, y, "Tian Reid")

    y -= 0.35 * inch
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN, y, "Date:")
    c.setFont("Helvetica", 12)
    c.drawString(MARGIN + 1.5 * inch, y, "April 18, 2026")

    # Feature summary
    y -= 0.7 * inch
    c.setFillColor(OCEAN_BLUE)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(MARGIN, y, "Application Features")

    y -= 0.1 * inch
    c.setStrokeColor(GOLD)
    c.setLineWidth(2)
    c.line(MARGIN, y, MARGIN + 2.2 * inch, y)

    features = [
        "Appointment scheduling — time-slot booking + custom requests",
        "Real-time messaging with push & email notifications",
        "Client profiles with clinical notes, diagnosis, and medications",
        "Revenue tracking with auto-billing on session completion",
        "Appointment analytics, client activity, and revenue reports",
        "HIPAA-aware contact/intake form",
        "Crisis resources page with national hotlines",
        "Dark mode, responsive design (desktop, tablet, mobile)",
        "Progressive Web App — installable on phones & desktops",
        "Docker containerized for easy deployment",
    ]

    y -= 0.3 * inch
    c.setFont("Helvetica", 10)
    c.setFillColor(BODY_TEXT)
    for feat in features:
        c.setFillColor(GOLD)
        c.drawString(MARGIN + 0.1 * inch, y + 2, "\u2022")
        c.setFillColor(BODY_TEXT)
        c.drawString(MARGIN + 0.3 * inch, y, feat)
        y -= 0.22 * inch

    draw_page_number(c, 1, total_pages)
    c.showPage()

    # ═══════════════════════════════════════════
    # SCREENSHOT PAGES
    # ═══════════════════════════════════════════
    for i, page in enumerate(PAGES):
        img_path = os.path.join(SCREENSHOT_DIR, page["file"])
        if not os.path.exists(img_path):
            print(f"WARNING: Missing screenshot: {img_path}")
            continue

        # Header bar
        c.setFillColor(DARK_BLUE)
        c.rect(0, PAGE_H - 0.6 * inch, PAGE_W, 0.6 * inch, fill=1, stroke=0)

        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(MARGIN, PAGE_H - 0.4 * inch, page["title"])

        c.setFillColor(GOLD)
        c.setFont("Helvetica", 9)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - 0.4 * inch, "Shore Crisis Management")

        # Description
        y = PAGE_H - 1.0 * inch
        c.setFillColor(BODY_TEXT)
        c.setFont("Helvetica", 10)

        # Word-wrap description
        words = page["desc"].split()
        line = ""
        for word in words:
            test = line + " " + word if line else word
            if c.stringWidth(test, "Helvetica", 10) > CONTENT_W:
                c.drawString(MARGIN, y, line)
                y -= 0.18 * inch
                line = word
            else:
                line = test
        if line:
            c.drawString(MARGIN, y, line)
            y -= 0.18 * inch

        y -= 0.15 * inch

        # Screenshot image
        img = ImageReader(img_path)
        iw, ih = img.getSize()
        aspect = ih / iw

        # Fit to page width with max height constraint
        display_w = CONTENT_W
        display_h = display_w * aspect

        max_h = y - 0.7 * inch  # leave room for footer
        if display_h > max_h:
            display_h = max_h
            display_w = display_h / aspect

        # Center horizontally
        x = (PAGE_W - display_w) / 2

        # Light border around screenshot
        c.setStrokeColor(HexColor("#E2E8F0"))
        c.setLineWidth(0.5)
        c.rect(x - 2, y - display_h - 2, display_w + 4, display_h + 4, fill=0, stroke=1)

        c.drawImage(img_path, x, y - display_h, width=display_w, height=display_h)

        draw_page_number(c, i + 2, total_pages)
        c.showPage()

    c.save()
    print(f"Created: {FILENAME}")


if __name__ == "__main__":
    build_pdf()
