---
title: Building your first agent
description: Define one tool, run the loop that lets a model call it, and see why the loop is the whole trick.
mode: tutorial
serves:
  - building-agents/agent-loop/defines-a-tool
  - building-agents/agent-loop/implements-the-loop
assumes:
  - concepts/how-models-work/explains-generation
---

<div data-lesson="building-agents/agent-loop" hidden></div>

An agent is a model in a loop with tools. That sentence is the whole
architecture; the rest of this lesson makes it concrete. You will define one
tool, write the loop, and watch a model use the tool to answer a question it
could not answer alone.

Every example below runs against a fixture: a fake model that behaves
deterministically, so you can predict what happens and check yourself.
Swapping in a real model changes one line at the end.

## A tool is a function plus a description

The model cannot run code. What it can do is emit text that says "call
this function with these arguments". So a tool has two halves: the
function you will run, and the description the model reads to decide when
to ask for it.

```python
def get_weather(city: str) -> str:
    data = {"Amsterdam": "14°C, rain", "Lisbon": "27°C, sun"}
    return data.get(city, f"no data for {city}")

TOOLS = {
    "get_weather": {
        "fn": get_weather,
        "description": "Current weather for a city. Args: city (str).",
    },
}
```

Predict before you run. What does the next line print?

```python
print(TOOLS["get_weather"]["fn"]("Lisbon"))
```

<div class="checkpoint not-content" data-checkpoint="predict-tool-call" data-kind="predict" data-answer="27°C, sun">
<span class="cp-kind">Checkpoint · predict</span><span class="cp-state"></span>
<p>Type exactly what is printed.</p>
<textarea rows="1"></textarea>
<button type="button" class="cp-check">Check</button>
<button type="button" class="cp-hint-btn">Hint</button>
<button type="button" class="cp-skip">Skip</button>
<div class="cp-hint" hidden>The tool is a plain function. Look up "Lisbon" in the dict.</div>
<div class="cp-feedback" aria-live="polite"></div>
<pre class="cp-reveal" hidden>27°C, sun</pre>
</div>

The description matters as much as the code. The model chooses tools by
reading descriptions, so a vague one ("weather stuff") gets called at the
wrong times and with the wrong arguments.

<div class="pitfall not-content">
<strong>Pitfall: describing the implementation instead of the use.</strong>
A first draft often reads "Calls the OpenWeather API with an HTTP GET".
The model does not care how; it needs to know <em>when</em> and <em>with
what</em>. Rule: write the description for the caller, name each argument
and its type, and say what comes back.
</div>

## The loop

Now the fixture model. It looks at the last message and either asks for a
tool or gives a final answer.

```python
def fake_model(messages):
    last = messages[-1]
    if last["role"] == "user" and "weather" in last["content"]:
        city = last["content"].split(" in ")[-1].rstrip("?")
        return {"tool": "get_weather", "args": {"city": city}}
    if last["role"] == "tool":
        return {"answer": f"It is {last['content']} there."}
    return {"answer": "I can only help with weather."}
```

And the loop itself. Read it slowly; every agent framework you will ever
use is this with more error handling.

```python
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
```

Predict again. What does this print?

```python
print(run("What is the weather in Amsterdam?"))
```

<div class="checkpoint not-content" data-checkpoint="predict-loop" data-kind="predict" data-answer="It is 14°C, rain there.">
<span class="cp-kind">Checkpoint · predict</span><span class="cp-state"></span>
<p>Type exactly what is printed.</p>
<textarea rows="1"></textarea>
<button type="button" class="cp-check">Check</button>
<button type="button" class="cp-hint-btn">Hint</button>
<button type="button" class="cp-skip">Skip</button>
<div class="cp-hint" hidden>Trace two rounds: first the model asks for a tool, then it sees the tool result and answers.</div>
<div class="cp-feedback" aria-live="polite"></div>
<pre class="cp-reveal" hidden>It is 14°C, rain there.</pre>
</div>

Notice `max_steps`. Without it, a model that keeps asking for tools runs
forever and spends your money. Every real loop has a budget.

<div class="checkpoint not-content" data-checkpoint="order-the-loop" data-kind="order">
<span class="cp-kind">Checkpoint · order</span><span class="cp-state"></span>
<p>Put the steps of one iteration of the agent loop in order.</p>
<ol>
<li data-pos="1">Send the message list to the model</li>
<li data-pos="2">Check whether the reply is a final answer; if so, return it</li>
<li data-pos="3">Look up the requested tool by name</li>
<li data-pos="4">Run the tool function with the model's arguments</li>
<li data-pos="5">Append the tool call and the tool result to the messages</li>
</ol>
<button type="button" class="cp-check">Check</button>
<button type="button" class="cp-hint-btn">Hint</button>
<button type="button" class="cp-skip">Skip</button>
<div class="cp-hint" hidden>What does the loop need to know before it can decide whether to run a tool at all?</div>
<div class="cp-feedback" aria-live="polite"></div>
</div>

## Exercise

Add a second tool, `get_time(city)`, returning a fixed string per city.
Extend `fake_model` so a question containing "time" asks for it. Run the
loop on "What is the time in Lisbon?" and check the answer.

**Stretch:** replace `fake_model` with a call to a real model API that
supports tool use, keeping `run` unchanged. The only new work is
translating the API's tool-call format into the `{"tool": ..., "args": ...}`
shape the loop already understands.

## Recap

1. A tool is a function plus a description written for the model.
2. The loop is: ask the model, run the tool it asks for, append the result,
   repeat until it answers or the budget runs out.
3. The model never runs anything; your loop does. That is where safety
   controls go.

You can now define a tool and implement the loop that lets a model use it.

**Next:** the course page for [Building agents](/building-agents/).

<div class="not-content"><button type="button" class="recap-finish" data-finish>Mark lesson finished</button></div>
<script src="/ai-training/spike/lesson.js" defer></script>
