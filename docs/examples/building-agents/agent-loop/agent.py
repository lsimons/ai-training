"""The complete program behind the lesson "Building your first agent".

Run any step with:  python3 agent.py <step>   where step is one of the
names in STEPS below. The lesson's Predict checkpoints run these in CI.
"""

import sys


def get_weather(city: str) -> str:
    data = {"Amsterdam": "14°C, rain", "Lisbon": "27°C, sun"}
    return data.get(city, f"no data for {city}")


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
        return {"answer": f"It is {last['content']} there."}
    return {"answer": "I can only help with weather."}


def run(question, model=fake_model, max_steps=5):
    messages = [{"role": "user", "content": question}]
    for _ in range(max_steps):
        reply = model(messages)
        if "answer" in reply:
            return reply["answer"]
        tool = TOOLS[reply["tool"]]
        result = tool["fn"](**reply["args"])
        messages.append({"role": "assistant", "content": str(reply)})
        messages.append({"role": "tool", "content": result})
    return "gave up"


STEPS = {
    "tool_call": lambda: print(TOOLS["get_weather"]["fn"]("Lisbon")),
    "loop": lambda: print(run("What is the weather in Amsterdam?")),
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
