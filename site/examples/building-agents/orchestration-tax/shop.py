"""The shop behind the lesson "What every extra agent costs": its tools and its golden set.

The orders, the stock, the policy texts and the twelve customer emails are
illustrative, written by the author for the lesson.
"""

from dataclasses import dataclass

ORDERS: dict[str, dict[str, object]] = {
    "1042": {"item": "kettle", "days_since_delivery": 12},
    "1090": {"item": "toaster", "days_since_delivery": 8},
    "1107": {"item": "blender", "days_since_delivery": 40},
    "1113": {"item": "kettle", "days_since_delivery": 3},
    "1120": {"item": "desk lamp", "days_since_delivery": 5},
    "1131": {"item": "toaster", "days_since_delivery": 20},
    "1145": {"item": "radio", "days_since_delivery": 15},
    "1152": {"item": "kettle", "days_since_delivery": 25},
    "1160": {"item": "blender", "days_since_delivery": 2},
    "1174": {"item": "radio", "days_since_delivery": 33},
    "1188": {"item": "toaster", "days_since_delivery": 10},
    "1196": {"item": "desk lamp", "days_since_delivery": 45},
}

STOCK: dict[str, dict[str, int]] = {
    "kettle": {"in_stock": 0, "back_in_days": 21},
    "desk lamp": {"in_stock": 0, "back_in_days": 14},
    "toaster": {"in_stock": 6, "back_in_days": 0},
    "radio": {"in_stock": 4, "back_in_days": 0},
    "blender": {"in_stock": 3, "back_in_days": 0},
}

POLICY: dict[str, str] = {
    "returns": "Returns and refunds are possible within 30 days of delivery.",
    "drop-off": "You can bring an item back to the shop on weekdays from 9:00 to 17:00.",
    "gift card": "A refund can go to a gift card instead of the card that paid.",
}


def get_order(order_id: str) -> dict[str, object]:
    return {"order": order_id, **ORDERS[order_id]}


def get_policy(topic: str) -> dict[str, object]:
    return {"topic": topic, "text": POLICY[topic]}


def check_stock(order_id: str) -> dict[str, object]:
    item = str(ORDERS[order_id]["item"])
    return {"item": item, **STOCK[item]}


TOOLS = {"get_order": get_order, "get_policy": get_policy, "check_stock": check_stock}

# The golden set. A reply passes when it contains every `must` phrase and
# none of the `must_not` phrases.


@dataclass
class Item:
    id: str
    email: str
    must: list[str]
    must_not: list[str]


GOLDEN: list[Item] = [
    Item(
        id="g01",
        email="Hello, the kettle from order 1042 leaks. I would like my money back.",
        must=["refund"],
        must_not=["replacement"],
    ),
    Item(
        id="g02",
        email="My toaster from order 1090 does not heat. Please send me a new one.",
        must=["replacement toaster is on its way"],
        must_not=[],
    ),
    Item(
        id="g03",
        email="The blender from order 1107 is too loud. I want a refund.",
        must=["30 days"],
        must_not=["is on its way"],
    ),
    Item(
        id="g04",
        email="The kettle from order 1113 has a cracked lid. Please send me a new one.",
        must=["out of stock"],
        must_not=["is on its way"],
    ),
    Item(
        id="g05",
        email="The desk lamp from order 1120 flickers. Can you send me a new one?",
        must=["out of stock"],
        must_not=["is on its way"],
    ),
    Item(
        id="g06",
        email=(
            "The toaster from order 1131 burns the bread. I would like my money back. "
            "Also, can I bring the toaster back to the shop myself?"
        ),
        must=["refund", "weekdays"],
        must_not=[],
    ),
    Item(
        id="g07",
        email="The radio from order 1145 has no sound. Please send me a new one.",
        must=["replacement radio is on its way"],
        must_not=[],
    ),
    Item(
        id="g08",
        email="The kettle from order 1152 switches off too early. Please send me a new one.",
        must=["out of stock"],
        must_not=["is on its way"],
    ),
    Item(
        id="g09",
        email=(
            "The blender from order 1160 was a gift, and it arrived broken. I want a refund. "
            "Please put the money on a gift card."
        ),
        must=["refund", "gift card"],
        must_not=[],
    ),
    Item(
        id="g10",
        email="The radio from order 1174 lost its antenna. Please send me a new one.",
        must=["30 days"],
        must_not=["is on its way"],
    ),
    Item(
        id="g11",
        email="The toaster from order 1188 is the wrong color. I would like my money back.",
        must=["refund"],
        must_not=["replacement"],
    ),
    Item(
        id="g12",
        email="The desk lamp from order 1196 is too dim. I want a refund.",
        must=["30 days"],
        must_not=["is on its way"],
    ),
]


def grade(item: Item, reply: str) -> bool:
    return all(p in reply for p in item.must) and not any(p in reply for p in item.must_not)
