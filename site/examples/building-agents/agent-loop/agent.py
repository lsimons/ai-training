"""The complete program behind the lesson "Building your first agent".

Run any step with:  python3 agent.py <step>   where step is one of the
names in STEPS below. The lesson's Predict checkpoints run these in CI.
"""

import sys


def get_weather(city: str) -> str:
    data = {"Amsterdam": "14°C, rain", "Lisbon": "27°C, sun"}
    if city not in data:
        raise LookupError(f"no data for {city}")
    return data[city]


TOOLS = {
    "get_weather": {
        "fn": get_weather,
        "description": "Current weather for a city. Args: city (str).",
    },
}


def fake_model(messages):
    last = messages[-1]
    if last["role"] == "user" and "weather" in last["content"]:
        city = last["content"].split(" in ")[-1].rstrip("?")
        return {"tool": "get_weather", "args": {"city": city}}
    if last["role"] == "tool":
        if last["content"].startswith("error:"):
            return {"answer": f"I could not check. The tool said: {last['content']}"}
        return {"answer": f"It is {last['content']} there."}
    return {"answer": "I can only help with weather."}


def run(question, model=fake_model, max_steps=5):
    messages = [{"role": "user", "content": question}]
    for _ in range(max_steps):
        reply = model(messages)
        if "answer" in reply:
            return reply["answer"]
        tool = TOOLS.get(reply["tool"])
        if tool is None:
            result = f"error: unknown tool {reply['tool']}"
        else:
            try:
                result = tool["fn"](**reply["args"])
            except Exception as exc:
                result = f"error: {exc}"
        messages.append({"role": "assistant", "content": str(reply)})
        messages.append({"role": "tool", "content": result})
    return "stopped: step limit"


STEPS = {
    "tool_call": lambda: print(TOOLS["get_weather"]["fn"]("Lisbon")),
    "loop": lambda: print(run("What is the weather in Amsterdam?")),
    "tool_error": lambda: print(run("What is the weather in Oslo?")),
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
