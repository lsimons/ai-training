"""The complete program behind the lesson "What a tool call looks like on the wire".

Run any step with:  python3 wire.py <step>   where step is one of the
names in STEPS below. The lesson's Predict blocks run these in CI.

The message formats follow the public Claude API tool-use documentation.
Nothing here talks to a network. `fake_api` stands in for the model
endpoint and answers the same way every time.
"""

import json
import sys

TOOLS = [
    {
        "name": "get_weather",
        "description": "Current weather for a city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name, for example Lisbon."}
            },
            "required": ["city"],
        },
    },
]

WEATHER = {"Amsterdam": "14°C, rain", "Lisbon": "27°C, sun"}


def get_weather(city: str) -> str:
    if city not in WEATHER:
        raise LookupError(f"no data for {city}")
    return WEATHER[city]


def first_request(question):
    return {
        "model": "fake-model",
        "max_tokens": 200,
        "system": "You answer weather questions. Use the tool for live data.",
        "tools": TOOLS,
        "messages": [{"role": "user", "content": question}],
    }


def fake_api(request):
    """Stand-in for the model endpoint. Replies the way the real API is documented to."""
    last = request["messages"][-1]
    if last["role"] == "user" and isinstance(last["content"], str):
        city = last["content"].split(" in ")[-1].rstrip("?")
        return {
            "id": "msg_01",
            "role": "assistant",
            "stop_reason": "tool_use",
            "content": [
                {"type": "text", "text": f"I'll check the weather in {city}."},
                {
                    "type": "tool_use",
                    "id": "toolu_01",
                    "name": "get_weather",
                    "input": {"city": city},
                },
            ],
        }
    result = last["content"][0]["content"]
    return {
        "id": "msg_02",
        "role": "assistant",
        "stop_reason": "end_turn",
        "content": [{"type": "text", "text": f"It is {result} there."}],
    }


def tool_result_message(reply):
    block = next(b for b in reply["content"] if b["type"] == "tool_use")
    result = get_weather(**block["input"])
    return {
        "role": "user",
        "content": [{"type": "tool_result", "tool_use_id": block["id"], "content": result}],
    }


def second_request(request, reply):
    messages = request["messages"] + [
        {"role": "assistant", "content": reply["content"]},
        tool_result_message(reply),
    ]
    return dict(request, messages=messages)


def show(value):
    print(json.dumps(value, indent=2, ensure_ascii=False))


def step_first_reply():
    show(fake_api(first_request("What is the weather in Lisbon?")))


def step_tool_result():
    request = first_request("What is the weather in Lisbon?")
    show(tool_result_message(fake_api(request)))


def step_final_reply():
    request = first_request("What is the weather in Lisbon?")
    second = second_request(request, fake_api(request))
    print("messages in the second request:", len(second["messages"]))
    show(fake_api(second))


STEPS = {
    "first_reply": step_first_reply,
    "tool_result": step_tool_result,
    "final_reply": step_final_reply,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
