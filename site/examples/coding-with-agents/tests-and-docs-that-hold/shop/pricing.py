"""Order totals for the shop: the lines of an order, plus shipping.

Every amount is in euros. Orders from 50.00 EUR ship free, and smaller
orders pay a flat 4.95 EUR for shipping.
"""

FREE_SHIPPING_FROM = 50.00
SHIPPING = 4.95


def subtotal(lines):
    """Add up the lines of an order. Each line is (quantity, unit price)."""
    return round(sum(quantity * price for quantity, price in lines), 2)


def shipping(amount):
    """Return the shipping cost for an order with this subtotal."""
    if amount >= FREE_SHIPPING_FROM:
        return 0.0
    return SHIPPING


def total(lines):
    """Return what the customer pays: the subtotal plus shipping."""
    amount = subtotal(lines)
    return round(amount + shipping(amount), 2)
