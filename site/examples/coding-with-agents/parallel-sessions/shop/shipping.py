"""Parcel prices for the web shop."""

import math


def quote(weight_kg: float) -> str:
    """The price of one parcel: 4.00 plus 1.50 per started kilo."""
    if weight_kg <= 0:
        raise ValueError("weight must be more than 0 kg")
    cents = 400 + 150 * math.ceil(weight_kg)
    return f"EUR {cents // 100}.{cents % 100:02d}"
