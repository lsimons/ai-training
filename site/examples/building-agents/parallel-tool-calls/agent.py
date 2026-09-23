"""The complete program behind the lesson "Several tool calls in one turn".

Run any step with:  python3 agent.py <step>   where step is one of the
names in STEPS below. The lesson's Predict checkpoints run these in CI.

The loop is the one from "When a tool fails", with one change: a model
reply carries a list of calls, each with an id, and the loop runs the whole
list before it appends one tool message that holds every result under its
id. The `execute` parameter decides whether the list runs one call after
another or all calls at the same time.
"""

import sys
from concurrent.futures import ThreadPoolExecutor

WEATHER = {"Amsterdam": "14°C, rain", "Lisbon": "27°C, sun", "Oslo": "6°C, snow"}
CITIES = ["Amsterdam", "Lisbon", "Oslo"]
QUESTION = "Compare the weather in Amsterdam, Lisbon and Oslo."


def get_weather(city: str) -> str:
    return WEATHER.get(city, f"no data for {city}")


def suggest_clothing(weather: str) -> str:
    if "rain" in weather:
        return "a raincoat"
    if "snow" in weather:
        return "a winter coat"
    return "a t-shirt"


TOOLS = {
    "get_weather": {
        "fn": get_weather,
        "description": "Current weather for a city. Args: city (str).",
    },
    "suggest_clothing": {
        "fn": suggest_clothing,
        "description": "What to pack for a weather report. Args: weather (str).",
    },
}


# The fake models. Each reads the message list to see which results it has.


def results_by_call(messages):
    """Pair every request the model made with its result, by id."""
    requests = {}
    results = {}
    for message in messages:
        if message["role"] == "assistant":
            for call in message["content"]["calls"]:
                requests[call["id"]] = call
        if message["role"] == "tool":
            for result in message["content"]:
                results[result["id"]] = result["content"]
    return requests, results


def weather_so_far(messages) -> dict:
    """City to weather text, from the get_weather results so far."""
    requests, results = results_by_call(messages)
    return {
        requests[call_id]["args"]["city"]: text
        for call_id, text in results.items()
        if requests[call_id]["tool"] == "get_weather"
    }


def weather_call(number: int, city: str) -> dict:
    return {"id": f"call_{number}", "tool": "get_weather", "args": {"city": city}}


def summary(known: dict) -> str:
    return " ".join(f"{city}: {known[city]}." for city in CITIES)


def model_one_at_a_time(messages):
    """Asks for one city per turn, the way a model does under disable_parallel_tool_use."""
    known = weather_so_far(messages)
    missing = [city for city in CITIES if city not in known]
    if missing:
        return {"calls": [weather_call(len(known) + 1, missing[0])]}
    return {"answer": summary(known)}


def model_all_at_once(messages):
    """Asks for every city in one reply."""
    known = weather_so_far(messages)
    if not known:
        return {"calls": [weather_call(number, city) for number, city in enumerate(CITIES, 1)]}
    return {"answer": summary(known)}


def model_with_follow_up(messages):
    """Asks for every city, then for clothing advice on the first result, then answers."""
    known = weather_so_far(messages)
    if not known:
        return {"calls": [weather_call(number, city) for number, city in enumerate(CITIES, 1)]}
    requests, results = results_by_call(messages)
    advice = [
        text for call_id, text in results.items() if requests[call_id]["tool"] == "suggest_clothing"
    ]
    if not advice:
        call = {"id": "call_4", "tool": "suggest_clothing", "args": {"weather": known["Amsterdam"]}}
        return {"calls": [call]}
    return {"answer": f"{summary(known)} Pack {advice[0]} for Amsterdam."}


# The harness. `execute` takes the list of calls and returns the list of results.


def call_tool(call: dict) -> dict:
    tool = TOOLS[call["tool"]]
    return {"id": call["id"], "content": tool["fn"](**call["args"])}


def in_order(calls: list) -> list:
    return [call_tool(call) for call in calls]


def together(calls: list) -> list:
    with ThreadPoolExecutor() as pool:
        return list(pool.map(call_tool, calls))


def outcome(stop, answer, rounds, messages) -> dict:
    return {"stop": stop, "answer": answer, "rounds": rounds, "messages": messages}


def run(question, model, execute=in_order, max_steps=5):
    messages = [{"role": "user", "content": question}]
    rounds = 0
    for _ in range(max_steps):
        rounds += 1
        reply = model(messages)
        if "answer" in reply:
            return outcome("end_turn", reply["answer"], rounds, messages)
        results = execute(reply["calls"])
        messages.append({"role": "assistant", "content": reply})
        messages.append({"role": "tool", "content": results})
    return outcome("max_steps", None, rounds, messages)


def describe_call(call: dict) -> str:
    args = ", ".join(f"{name}={value!r}" for name, value in call["args"].items())
    return f"{call['id']} {call['tool']}({args})"


def show(outcome) -> None:
    for message in outcome["messages"]:
        if message["role"] == "user":
            print(f"user: {message['content']!r}")
        elif message["role"] == "assistant":
            calls = message["content"]["calls"]
            print("assistant: " + ", ".join(describe_call(call) for call in calls))
        else:
            results = message["content"]
            print("tool: " + ", ".join(f"{r['id']} {r['content']!r}" for r in results))
    print(f"rounds: {outcome['rounds']}")
    print(f"stop: {outcome['stop']}")
    if outcome["answer"] is not None:
        print(f"answer: {outcome['answer']}")


def step_one_at_a_time() -> None:
    show(run(QUESTION, model=model_one_at_a_time))


def step_together() -> None:
    show(run(QUESTION, model=model_all_at_once, execute=together))


def step_follow_up() -> None:
    show(run(QUESTION, model=model_with_follow_up, execute=together))


STEPS = {
    "one_at_a_time": step_one_at_a_time,
    "together": step_together,
    "follow_up": step_follow_up,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
