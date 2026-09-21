"""Put the real values back into a reply that was drafted on redacted text.

The reply below was written for the redacted email, so it says "Person 1"
and "Person 2". The map that made the redaction turns the placeholders
back into the names. The map never went into the tool, so the tool never
saw the names, and the reply that goes to the customer is still addressed
to a person.

    python3 restore.py
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import redaction  # noqa: E402  (imported after sys.path knows this directory)

REPLY = """\
Dear Person 1,

Thank you for letting us know, and I am sorry the leak came back so soon
after Person 2's visit. We would like to send a technician again this
week, and we pay for the visit. Could you give us two time windows that
suit you, outside your morning departure? Until then, please keep the
water supply to the dishwasher closed.

Kind regards,
Norrbeck Appliances customer support
"""

if __name__ == "__main__":
    print(redaction.restore(REPLY, redaction.MAP), end="")
