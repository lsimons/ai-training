"""Adds up the lines of the sample invoice and the VAT on them."""

VAT_RATE = 0.21

LINES = [
    ("Consulting, 6 hours", 6, 95.00),
    ("Travel", 1, 42.50),
    ("License, one seat", 1, 120.00),
]


def totals(lines: "list[tuple[str, int, float]]") -> "tuple[float, float, float]":
    net = sum(quantity * price for _, quantity, price in lines)
    vat = round(net * VAT_RATE, 2)
    return net, vat, round(net + vat, 2)


def main() -> None:
    net, vat, gross = totals(LINES)
    print(f"net   {net:9.2f}")
    print(f"VAT   {vat:9.2f}")
    print(f"total {gross:9.2f}")


if __name__ == "__main__":
    main()
