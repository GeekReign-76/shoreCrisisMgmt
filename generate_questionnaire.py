#!/usr/bin/env python3
"""
Generate a fillable PDF questionnaire for a mental health business website.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfform

FILENAME = "Mental_Health_Business_Website_Questionnaire.pdf"

# Colors
DARK_TEAL = HexColor("#1a5c5c")
MEDIUM_TEAL = HexColor("#2a8a8a")
LIGHT_BG = HexColor("#f0f7f7")
WHITE = HexColor("#ffffff")
BLACK = HexColor("#000000")
GRAY = HexColor("#555555")
LIGHT_GRAY = HexColor("#cccccc")

PAGE_W, PAGE_H = letter
LEFT_MARGIN = 0.75 * inch
RIGHT_MARGIN = PAGE_W - 0.75 * inch
CONTENT_W = RIGHT_MARGIN - LEFT_MARGIN
field_counter = 0


def new_field_name():
    global field_counter
    field_counter += 1
    return f"field_{field_counter}"


def draw_header(c, y, text, is_first_page=False):
    """Draw a section header."""
    if y < 1.5 * inch:
        c.showPage()
        y = PAGE_H - 0.75 * inch
        draw_page_footer(c)

    # Section header background
    header_h = 0.35 * inch
    c.setFillColor(DARK_TEAL)
    c.roundRect(LEFT_MARGIN, y - header_h + 0.05 * inch, CONTENT_W, header_h, 4, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(LEFT_MARGIN + 0.15 * inch, y - 0.2 * inch, text)
    return y - header_h - 0.15 * inch


def draw_subheader(c, y, text):
    """Draw a sub-section label."""
    if y < 1.2 * inch:
        c.showPage()
        y = PAGE_H - 0.75 * inch
        draw_page_footer(c)
    c.setFillColor(MEDIUM_TEAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(LEFT_MARGIN + 0.05 * inch, y, text)
    return y - 0.22 * inch


def draw_label(c, y, text):
    """Draw a field label."""
    if y < 1.0 * inch:
        c.showPage()
        y = PAGE_H - 0.75 * inch
        draw_page_footer(c)
    c.setFillColor(BLACK)
    c.setFont("Helvetica", 9)
    c.drawString(LEFT_MARGIN + 0.1 * inch, y, text)
    return y - 0.18 * inch


def draw_text_field(c, y, height=0.28 * inch):
    """Draw a single-line fillable text field."""
    if y - height < 0.8 * inch:
        c.showPage()
        y = PAGE_H - 0.75 * inch
        draw_page_footer(c)
    form = c.acroForm
    form.textfield(
        name=new_field_name(),
        x=LEFT_MARGIN + 0.1 * inch,
        y=y - height,
        width=CONTENT_W - 0.2 * inch,
        height=height,
        borderColor=LIGHT_GRAY,
        fillColor=WHITE,
        textColor=BLACK,
        fontSize=9,
        borderWidth=0.5,
    )
    return y - height - 0.1 * inch


def draw_multiline_field(c, y, height=0.75 * inch):
    """Draw a multi-line fillable text field."""
    if y - height < 0.8 * inch:
        c.showPage()
        y = PAGE_H - 0.75 * inch
        draw_page_footer(c)
    form = c.acroForm
    form.textfield(
        name=new_field_name(),
        x=LEFT_MARGIN + 0.1 * inch,
        y=y - height,
        width=CONTENT_W - 0.2 * inch,
        height=height,
        borderColor=LIGHT_GRAY,
        fillColor=WHITE,
        textColor=BLACK,
        fontSize=9,
        borderWidth=0.5,
        fieldFlags="multiline",
    )
    return y - height - 0.1 * inch


def draw_checkbox_row(c, y, options):
    """Draw a row of checkboxes with labels."""
    if y < 1.0 * inch:
        c.showPage()
        y = PAGE_H - 0.75 * inch
        draw_page_footer(c)
    form = c.acroForm
    x = LEFT_MARGIN + 0.15 * inch
    box_size = 12
    for opt in options:
        if x + len(opt) * 5.5 + 20 > RIGHT_MARGIN:
            y -= 0.25 * inch
            x = LEFT_MARGIN + 0.15 * inch
        form.checkbox(
            name=new_field_name(),
            x=x,
            y=y - 2,
            size=box_size,
            borderColor=MEDIUM_TEAL,
            fillColor=WHITE,
            buttonStyle="check",
        )
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 8.5)
        c.drawString(x + box_size + 3, y, opt)
        x += len(opt) * 5.2 + box_size + 18
    return y - 0.28 * inch


def draw_page_footer(c):
    c.setFont("Helvetica-Oblique", 7)
    c.setFillColor(GRAY)
    c.drawCentredString(PAGE_W / 2, 0.4 * inch, "Mental Health Business — Website Planning Questionnaire")


def draw_question(c, y, label, multiline=False, field_height=None):
    """Convenience: draw a label + field."""
    y = draw_label(c, y, label)
    if multiline:
        h = field_height or 0.75 * inch
        y = draw_multiline_field(c, y, height=h)
    else:
        h = field_height or 0.28 * inch
        y = draw_text_field(c, y, height=h)
    return y


def build_pdf():
    c = canvas.Canvas(FILENAME, pagesize=letter)
    c.setTitle("Mental Health Business Website Questionnaire")

    # ── Title Page ──
    # Background band
    c.setFillColor(DARK_TEAL)
    c.rect(0, PAGE_H - 2.8 * inch, PAGE_W, 2.8 * inch, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 1.2 * inch, "Website Planning Questionnaire")
    c.setFont("Helvetica", 14)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 1.6 * inch, "Mental Health Practice / Business")
    c.setFont("Helvetica-Oblique", 10)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 2.1 * inch, "Complete this form to gather the information needed to build your website.")
    c.drawCentredString(PAGE_W / 2, PAGE_H - 2.35 * inch, "All fields are fillable — type directly into this PDF and save.")

    y = PAGE_H - 3.3 * inch

    # Instructions
    c.setFillColor(LIGHT_BG)
    c.roundRect(LEFT_MARGIN, y - 1.1 * inch, CONTENT_W, 1.1 * inch, 6, fill=1, stroke=0)
    c.setFillColor(DARK_TEAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(LEFT_MARGIN + 0.15 * inch, y - 0.2 * inch, "How to use this questionnaire:")
    c.setFont("Helvetica", 9)
    c.setFillColor(GRAY)
    instructions = [
        "1.  Work through each section at your own pace — skip anything that doesn't apply yet.",
        "2.  The more detail you provide, the better your website will reflect your practice.",
        "3.  Don't worry about perfect wording — your web designer will refine the copy.",
        "4.  Save this PDF when done and send it to your web developer.",
    ]
    iy = y - 0.4 * inch
    for line in instructions:
        c.drawString(LEFT_MARGIN + 0.2 * inch, iy, line)
        iy -= 0.17 * inch

    y = iy - 0.25 * inch

    # ═══════════════════════════════════════════
    # SECTION 1 — Business Basics
    # ═══════════════════════════════════════════
    y = draw_header(c, y, "1.  BUSINESS BASICS")
    y = draw_question(c, y, "Business / Practice Name:")
    y = draw_question(c, y, "Tagline or Slogan (if any):")
    y = draw_question(c, y, "Owner / Founder Full Name:")
    y = draw_question(c, y, "Professional Credentials (e.g., LPC, LCSW, PhD, PsyD, LMFT):")
    y = draw_question(c, y, "Business Phone Number:")
    y = draw_question(c, y, "Business Email Address:")
    y = draw_question(c, y, "Physical Address (or 'Virtual Only'):")
    y = draw_question(c, y, "Business Hours:")
    y = draw_question(c, y, "Do you have a logo? If yes, what file format? (PNG, SVG, etc.):")
    y = draw_question(c, y, "Preferred brand colors (if any — list hex codes or describe):")
    y = draw_question(c, y, "Do you have an existing website or social media pages? List URLs:", multiline=True, field_height=0.55*inch)

    # ═══════════════════════════════════════════
    # SECTION 2 — About You / Your Practice
    # ═══════════════════════════════════════════
    c.showPage()
    draw_page_footer(c)
    y = PAGE_H - 0.75 * inch

    y = draw_header(c, y, "2.  ABOUT YOU / YOUR PRACTICE")
    y = draw_question(c, y, "Tell your story — why did you get into mental health? (This becomes your 'About' page):", multiline=True, field_height=1.1*inch)
    y = draw_question(c, y, "Your educational background and training:", multiline=True, field_height=0.65*inch)
    y = draw_question(c, y, "Professional licenses and certifications:", multiline=True, field_height=0.55*inch)
    y = draw_question(c, y, "Years of experience:")
    y = draw_question(c, y, "Professional memberships / associations:", multiline=True, field_height=0.5*inch)
    y = draw_question(c, y, "Your therapeutic approach / philosophy (e.g., CBT, DBT, EMDR, person-centered):", multiline=True, field_height=0.65*inch)
    y = draw_question(c, y, "What makes your practice different from others in the area?", multiline=True, field_height=0.65*inch)

    # ═══════════════════════════════════════════
    # SECTION 3 — Services
    # ═══════════════════════════════════════════
    c.showPage()
    draw_page_footer(c)
    y = PAGE_H - 0.75 * inch

    y = draw_header(c, y, "3.  SERVICES OFFERED")
    y = draw_label(c, y, "Check all service types you plan to offer:")
    services = [
        "Individual Therapy", "Couples Therapy", "Family Therapy", "Group Therapy",
        "Child / Adolescent", "Psychiatric Evaluation", "Medication Management",
        "Psychological Testing", "Telehealth / Online", "In-Person", "Workshops / Classes",
        "Corporate / EAP", "Crisis Intervention", "Substance Abuse", "Other"
    ]
    y = draw_checkbox_row(c, y, services[:5])
    y = draw_checkbox_row(c, y, services[5:10])
    y = draw_checkbox_row(c, y, services[10:])

    y -= 0.05 * inch
    y = draw_question(c, y, "If 'Other', please describe:", multiline=True, field_height=0.45*inch)
    y = draw_question(c, y, "Describe each service briefly (this will be used on your Services page):", multiline=True, field_height=1.2*inch)
    y = draw_question(c, y, "Session length options (e.g., 50 min, 90 min):")
    y = draw_question(c, y, "Do you offer a free consultation? If so, how long?:")
    y = draw_question(c, y, "Session fee range (e.g., $100–$175 per session):")
    y = draw_question(c, y, "Do you offer sliding scale fees?:")

    # ═══════════════════════════════════════════
    # SECTION 4 — Specialties & Populations
    # ═══════════════════════════════════════════
    c.showPage()
    draw_page_footer(c)
    y = PAGE_H - 0.75 * inch

    y = draw_header(c, y, "4.  SPECIALTIES & POPULATIONS SERVED")
    y = draw_label(c, y, "Check the areas you specialize in:")
    specialties = [
        "Anxiety", "Depression", "Trauma / PTSD", "Grief & Loss",
        "Relationship Issues", "Stress Management", "Self-Esteem",
        "ADHD", "OCD", "Eating Disorders", "Bipolar Disorder",
        "Anger Management", "Life Transitions", "Career Counseling",
        "Addiction / Recovery", "Domestic Violence", "LGBTQ+ Issues",
        "Perinatal / Postpartum", "Chronic Illness", "Sleep Issues",
    ]
    for i in range(0, len(specialties), 5):
        y = draw_checkbox_row(c, y, specialties[i:i+5])

    y -= 0.05 * inch
    y = draw_question(c, y, "Other specialties not listed above:", multiline=True, field_height=0.45*inch)

    y = draw_label(c, y, "Age groups served (check all that apply):")
    ages = ["Children (0–12)", "Adolescents (13–17)", "Young Adults (18–25)", "Adults (26–64)", "Seniors (65+)"]
    y = draw_checkbox_row(c, y, ages)

    y = draw_question(c, y, "Do you specialize in any cultural or community-specific populations? Describe:", multiline=True, field_height=0.55*inch)

    # ═══════════════════════════════════════════
    # SECTION 5 — Insurance & Payment
    # ═══════════════════════════════════════════
    y = draw_header(c, y, "5.  INSURANCE & PAYMENT")
    y = draw_question(c, y, "Insurance panels you are credentialed with (list all):", multiline=True, field_height=0.55*inch)
    y = draw_label(c, y, "Payment methods accepted (check all that apply):")
    payments = ["Cash", "Check", "Credit/Debit Card", "HSA/FSA", "Zelle/Venmo/PayPal", "Superbill Provided"]
    y = draw_checkbox_row(c, y, payments[:3])
    y = draw_checkbox_row(c, y, payments[3:])
    y = draw_question(c, y, "Do you provide superbills for out-of-network reimbursement?:")
    y = draw_question(c, y, "Cancellation / no-show policy:", multiline=True, field_height=0.55*inch)

    # ═══════════════════════════════════════════
    # SECTION 6 — Ideal Client & Messaging
    # ═══════════════════════════════════════════
    c.showPage()
    draw_page_footer(c)
    y = PAGE_H - 0.75 * inch

    y = draw_header(c, y, "6.  IDEAL CLIENT & WEBSITE MESSAGING")
    y = draw_question(c, y, "Describe your ideal client (who do you most want to help?):", multiline=True, field_height=0.75*inch)
    y = draw_question(c, y, "What is the main feeling you want a visitor to have when they land on your site?", multiline=True, field_height=0.55*inch)
    y = draw_question(c, y, "What is the #1 action you want visitors to take? (e.g., book a consultation, call you):")
    y = draw_question(c, y, "Key phrases or words that represent your brand tone (e.g., warm, professional, safe):", multiline=True, field_height=0.45*inch)
    y = draw_question(c, y, "Is there anything you do NOT want on the website?", multiline=True, field_height=0.45*inch)

    # ═══════════════════════════════════════════
    # SECTION 7 — Website Features & Pages
    # ═══════════════════════════════════════════
    y = draw_header(c, y, "7.  WEBSITE PAGES & FEATURES")
    y = draw_label(c, y, "Check the pages / features you want on your website:")
    pages = [
        "Home", "About Me", "Services", "Specialties", "Fees / Insurance",
        "Contact Page", "Online Booking", "Blog", "FAQ",
        "Testimonials", "Resources", "Crisis Info / Hotlines",
        "Client Portal Link", "Newsletter Signup", "Forms / Intake Paperwork"
    ]
    y = draw_checkbox_row(c, y, pages[:5])
    y = draw_checkbox_row(c, y, pages[5:10])
    y = draw_checkbox_row(c, y, pages[10:])

    y -= 0.05 * inch
    y = draw_question(c, y, "Other pages or features you'd like:", multiline=True, field_height=0.45*inch)

    # ═══════════════════════════════════════════
    # SECTION 8 — Online Booking & Intake
    # ═══════════════════════════════════════════
    c.showPage()
    draw_page_footer(c)
    y = PAGE_H - 0.75 * inch

    y = draw_header(c, y, "8.  ONLINE BOOKING & CLIENT INTAKE")
    y = draw_question(c, y, "Do you use an EHR / practice management system? Which one? (e.g., SimplePractice, TherapyNotes):")
    y = draw_question(c, y, "Do you want online scheduling embedded on the site?:")
    y = draw_question(c, y, "Do you need a contact form on the website?:")
    y = draw_question(c, y, "What information should the contact form collect?", multiline=True, field_height=0.55*inch)
    y = draw_question(c, y, "Do you have intake forms / consent forms you want downloadable or linked?:")

    # ═══════════════════════════════════════════
    # SECTION 9 — Content & Media
    # ═══════════════════════════════════════════
    y = draw_header(c, y, "9.  CONTENT & MEDIA")
    y = draw_question(c, y, "Do you have professional headshots / photos ready?:")
    y = draw_question(c, y, "Do you have photos of your office space?:")
    y = draw_question(c, y, "Do you want stock photography used? Any style preferences?:")
    y = draw_question(c, y, "Do you have any video content (intro video, welcome message)?:")
    y = draw_question(c, y, "Do you have written testimonials or reviews you'd like featured? (Note: check HIPAA considerations):", multiline=True, field_height=0.55*inch)
    y = draw_question(c, y, "Do you want a blog? If so, what topics would you write about?", multiline=True, field_height=0.55*inch)

    # ═══════════════════════════════════════════
    # SECTION 10 — Legal & Compliance
    # ═══════════════════════════════════════════
    c.showPage()
    draw_page_footer(c)
    y = PAGE_H - 0.75 * inch

    y = draw_header(c, y, "10.  LEGAL, COMPLIANCE & PRIVACY")
    y = draw_question(c, y, "Do you need a HIPAA-compliant contact form?:")
    y = draw_question(c, y, "Do you need a privacy policy page?:")
    y = draw_question(c, y, "Do you need a terms of service or disclaimer page?:")
    y = draw_question(c, y, "Good Faith Estimate / No Surprises Act — do you want info about this on the site?:")
    y = draw_question(c, y, "Do you have a Notice of Privacy Practices you want linked or downloadable?:")
    y = draw_question(c, y, "Any state-specific telehealth disclosure requirements?:")
    y = draw_question(c, y, "Other legal/compliance notes:", multiline=True, field_height=0.55*inch)

    # ═══════════════════════════════════════════
    # SECTION 11 — SEO & Marketing
    # ═══════════════════════════════════════════
    y = draw_header(c, y, "11.  SEO & ONLINE PRESENCE")
    y = draw_question(c, y, "Do you have a Google Business Profile set up?:")
    y = draw_question(c, y, "What city/region do you want to attract clients from?:")
    y = draw_question(c, y, "Are you listed on Psychology Today, TherapyDen, or other directories? List them:", multiline=True, field_height=0.45*inch)
    y = draw_question(c, y, "Social media accounts (Instagram, Facebook, LinkedIn, etc.):", multiline=True, field_height=0.45*inch)
    y = draw_question(c, y, "Do you have a preferred domain name? (e.g., www.yourpractice.com):")
    y = draw_question(c, y, "Do you already own a domain? If so, where is it registered? (GoDaddy, Namecheap, etc.):")

    # ═══════════════════════════════════════════
    # SECTION 12 — Technical
    # ═══════════════════════════════════════════
    c.showPage()
    draw_page_footer(c)
    y = PAGE_H - 0.75 * inch

    y = draw_header(c, y, "12.  TECHNICAL PREFERENCES")
    y = draw_question(c, y, "Do you have web hosting already? If so, which provider?:")
    y = draw_question(c, y, "Platform preference? (e.g., WordPress, Squarespace, Wix, custom — or no preference):")
    y = draw_question(c, y, "Do you need email addresses set up (e.g., hello@yourpractice.com)?:")
    y = draw_question(c, y, "Will you need to update the site yourself, or will someone manage it for you?:")
    y = draw_question(c, y, "Any website examples you admire? (Paste URLs of sites you like the look/feel of):", multiline=True, field_height=0.65*inch)

    # ═══════════════════════════════════════════
    # SECTION 13 — Budget & Timeline
    # ═══════════════════════════════════════════
    y = draw_header(c, y, "13.  BUDGET & TIMELINE")
    y = draw_question(c, y, "Approximate budget for the website:")
    y = draw_question(c, y, "Target launch date or deadline:")
    y = draw_question(c, y, "Is there a specific event driving the timeline? (e.g., practice opening date):")
    y = draw_question(c, y, "Are there future features you'd like to add later (Phase 2)?", multiline=True, field_height=0.55*inch)

    # ═══════════════════════════════════════════
    # SECTION 14 — Anything Else
    # ═══════════════════════════════════════════
    y = draw_header(c, y, "14.  ANYTHING ELSE")
    y = draw_question(c, y, "Is there anything else you'd like your web developer to know?", multiline=True, field_height=1.2*inch)
    y = draw_question(c, y, "Questions you have for the web developer:", multiline=True, field_height=0.85*inch)

    # Final note
    y -= 0.15 * inch
    c.setFillColor(DARK_TEAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(PAGE_W / 2, y, "Thank you for completing this questionnaire!")
    c.setFont("Helvetica", 9)
    c.setFillColor(GRAY)
    c.drawCentredString(PAGE_W / 2, y - 0.2 * inch, "Save this PDF and send it to your web developer to get started.")

    draw_page_footer(c)
    c.save()
    print(f"Created: {FILENAME}")


if __name__ == "__main__":
    build_pdf()
