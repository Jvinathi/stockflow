import os

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

from app.models.order import Order

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")

jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))


def generate_invoice_pdf(order: Order, company_name: str) -> bytes:
    """
    Renders the invoice.html template with this order's data, then converts
    it to PDF bytes using WeasyPrint. Returns raw PDF bytes (not a file path) --
    this lets the router stream it directly in the HTTP response.
    """
    template = jinja_env.get_template("invoice.html")

    items_data = [
        {
            "product_name": item.product.name,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "subtotal": item.subtotal,
        }
        for item in order.items
    ]

    html_content = template.render(
        company_name=company_name,
        customer_name=order.customer_name or "Walk-in Customer",
        order_id=order.id,
        order_date=order.created_at.strftime("%d %b %Y, %I:%M %p"),
        items=items_data,
        total_amount=order.total_amount,
    )

    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes