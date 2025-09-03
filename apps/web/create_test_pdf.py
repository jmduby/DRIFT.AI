from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

# Create a simple invoice PDF for testing
doc = SimpleDocTemplate("test_rumpke_invoice.pdf", pagesize=letter)
styles = getSampleStyleSheet()
story = []

# Add content
story.append(Paragraph("RUMPKE OF KENTUCKY, INC", styles['Title']))
story.append(Spacer(1, 12))
story.append(Paragraph("Invoice #: INV-2025-001", styles['Normal']))
story.append(Paragraph("Date: January 15, 2025", styles['Normal']))
story.append(Spacer(1, 12))

story.append(Paragraph("Bill To:", styles['Heading2']))
story.append(Paragraph("Helmwood Healthcare", styles['Normal']))
story.append(Paragraph("123 Healthcare Drive", styles['Normal']))
story.append(Paragraph("Louisville, KY 40202", styles['Normal']))
story.append(Paragraph("Account Number: HH-2489-KY", styles['Normal']))
story.append(Spacer(1, 12))

story.append(Paragraph("Services:", styles['Heading2']))
story.append(Paragraph("Weekly curbside collection - $95.00", styles['Normal']))
story.append(Paragraph("Bi-weekly recycling collection - $0.00", styles['Normal']))
story.append(Spacer(1, 12))

story.append(Paragraph("Total Due: $95.00", styles['Heading2']))
story.append(Spacer(1, 12))

story.append(Paragraph("Contact: service@rumpke.com | 859-555-0199", styles['Normal']))

# Build PDF
doc.build(story)
print("Created test_rumpke_invoice.pdf")