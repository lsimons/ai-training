"""Writes the invoice totals in the old semicolon format.

Finance still runs this at the end of every month. Nothing in the code
imports it, which makes it look unused.
"""

from invoice import LINES, totals


def main() -> None:
    net, vat, gross = totals(LINES)
    print(f"{net:.2f};{vat:.2f};{gross:.2f}".replace(".", ","))


if __name__ == "__main__":
    main()
