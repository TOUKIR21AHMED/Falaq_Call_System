# AI Readiness Notes

## Overview

The assignment mentions future AI features such as transcription, call summarization, and smart routing.

I would not build the first version of the call center around AI, because the core call-handling workflow needs to stay reliable even if an AI service is slow, unavailable, or expensive.

My approach would be to make the platform AI-ready without making AI a dependency for normal calls.

The main idea is:

```text
Core call system should work normally
              ↓
AI can process call data separately
              ↓
AI result can be added later
```

This keeps the system flexible and safer.

---

## AI Features I Would Consider

The most useful future AI features for this type of platform could be:

- speech-to-text transcription
- automatic call summary
- sentiment analysis
- customer intent detection
- smart routing
- agent assistance
- call quality review
- keyword detection
- follow-up suggestion
- automated CRM notes

I would not implement all of these at once.

The actual priority should come from business needs.

---

## AI Should Not Block the Main Call Flow

One of the most important decisions is to keep AI outside the critical call-handling path.

For example, when an agent ends a call, the system should not wait for an AI model to generate a summary before completing the call.

A better flow would be:

```text
Agent ends call
      ↓
Call saved as completed
      ↓
Response sent to agent
      ↓
Background job created
      ↓
AI processing starts
      ↓
Summary / transcript saved later
```

This means the agent can continue working even if the AI service takes several seconds or minutes.

---

## Transcription

One useful AI feature would be converting call audio into text.

The possible flow is:

```text
Call completed
      ↓
Recording available
      ↓
Transcription job created
      ↓
Speech-to-text service
      ↓
Transcript generated
      ↓
Transcript saved
```

The transcript could later be used for:

- call search
- summaries
- quality checking
- sentiment analysis
- keyword detection
- agent coaching

Before implementing this, I would confirm whether calls are legally allowed to be recorded and processed.

---

## Live vs Post-Call Transcription

There are two possible approaches.

### Live transcription

```text
Customer speaking
      ↓
Audio streamed
      ↓
Speech-to-text
      ↓
Text appears during call
```

This can help with live agent assistance, but it adds more complexity and latency requirements.

### Post-call transcription

```text
Call ends
      ↓
Recording processed
      ↓
Transcript generated
```

For the first AI version, I would probably prefer post-call transcription because it is simpler and does not affect the live conversation.

If the business later needs live assistance, real-time transcription can be added.

---

## Automatic Call Summaries

After a transcript is available, an LLM can generate a short structured summary.

For example:

```text
Transcript
    ↓
LLM
    ↓
Summary
```

A summary could contain:

```text
Customer issue
Actions taken
Final result
Follow-up needed
```

This could reduce the amount of manual note writing required from agents.

However, I would not automatically trust every AI-generated summary.

For important customer records, I would allow the agent to review or edit the generated summary before it becomes final.

---

## Example Summary Flow

A possible workflow is:

```text
Call completed
      ↓
Transcript generated
      ↓
Summary job created
      ↓
LLM creates summary
      ↓
Summary stored as draft
      ↓
Agent reviews
      ↓
Approved summary sent to CRM
```

This gives AI productivity benefits while keeping a human in control.

---

## Sentiment Analysis

Another possible feature is sentiment analysis.

The system could classify a conversation as something like:

```text
positive
neutral
negative
```

This could help supervisors identify difficult customer interactions.

For example:

```text
Transcript
    ↓
Sentiment model
    ↓
Negative
    ↓
Flag for supervisor review
```

I would treat sentiment as a supporting signal, not as a guaranteed fact.

Human conversations can be complex, especially across different languages and accents.

---

## Customer Intent Detection

AI could also help identify why the customer called.

Possible categories may include:

```text
billing
support
complaint
order issue
refund
sales
technical problem
```

This information could later support reporting or routing.

For example:

```text
Customer speaks
      ↓
Intent detected
      ↓
Technical Support
      ↓
Route to technical team
```

For the MVP, I would not make routing depend on AI.

I would introduce AI-based routing only after the model has been tested carefully.

---

## Smart Routing

The assignment mentions smart routing as a future capability.

A future routing system could consider information such as:

- customer history
- customer language
- detected intent
- agent skill
- previous agent interaction
- agent workload
- customer priority

The flow could look like:

```text
Incoming Call
      ↓
Customer identified
      ↓
Context collected
      ↓
Routing engine
      ↓
Best suitable agent
```

AI may help with scoring or classification, but I would still keep deterministic business rules around it.

For example, an AI model should not be able to route a restricted customer call to an unauthorized agent.

---

## Agent Assistance

Another useful future feature would be an AI assistant for agents.

During or after a call, AI could suggest:

- relevant customer information
- possible responses
- knowledge-base articles
- next steps
- follow-up actions

For example:

```text
Customer asks about refund
        ↓
System detects topic
        ↓
Relevant refund policy shown
        ↓
Agent decides what to say
```

The AI should assist the agent, not replace the agent's responsibility.

---

## AI and CRM Integration

AI-generated information may eventually need to be stored in the CRM.

Possible fields include:

```text
summary
customer intent
sentiment
follow-up action
keywords
```

I would not make the AI service directly write to the CRM.

I would prefer:

```text
AI Worker
    ↓
Call Center Backend
    ↓
Validation / Approval
    ↓
CRM Adapter
    ↓
CRM
```

This keeps business rules and permissions inside the main platform.

---

## Background Workers

AI tasks can be slow, so I would process them through background workers.

A possible architecture is:

```text
Call API
   ↓
Queue
   ↓
AI Worker
   ↓
AI Provider
   ↓
Database
```

For example, after a call completes:

```text
Call completed
      ↓
Create transcription job
      ↓
Worker processes audio
      ↓
Save transcript
      ↓
Create summary job
      ↓
Worker generates summary
```

This lets each step retry independently if something fails.

---

## Queue-Based AI Processing

One possible implementation in the current Node.js ecosystem could use BullMQ with Redis.

Conceptually:

```text
Call completed
      ↓
transcription queue
      ↓
worker
      ↓
transcript saved
      ↓
summary queue
      ↓
worker
      ↓
summary saved
```

The exact queue technology is not important to the business design.

The important point is that AI processing should be asynchronous and retryable.

---

## AI Provider Abstraction

I would avoid putting one AI provider directly throughout the application code.

Instead, I would use an AI service or adapter.

For example:

```text
Summary Service
      ↓
AI Adapter
      ↓
External AI Provider
```

This means the provider can be changed later.

For example, the company may choose:

```text
OpenAI
Azure OpenAI
Google
AWS
private model
on-premise model
```

The core call system should not need a complete rewrite if the AI provider changes.

---

## Data Model for Future AI

I would avoid putting too many AI-specific fields directly into the main Call document from the beginning.

A separate AI processing record may be cleaner.

Conceptually:

```text
Call
----
_id
customer
agent
status
duration


CallAIResult
------------
callId
transcript
summary
sentiment
intent
processingStatus
model
createdAt
updatedAt
```

This keeps the core call data separate from data that may change as AI features evolve.

---

## AI Processing Status

AI jobs may take time or fail.

So I would keep a processing state such as:

```text
pending
processing
completed
failed
```

For example:

```text
Call completed
      ↓
AI status = pending
      ↓
Worker starts
      ↓
AI status = processing
      ↓
Success
      ↓
AI status = completed
```

If something fails:

```text
processing
    ↓
failed
```

The system can then retry or show the failure to an admin.

---

## Handling AI Failures

The main call platform should continue working even if the AI provider is completely unavailable.

For example:

```text
Call completed
      ↓
AI service unavailable
      ↓
Call still saved successfully
      ↓
AI job retried later
```

I would not allow this situation:

```text
AI down
  ↓
Agent cannot end call
```

AI is an enhancement, not a core dependency.

---

## Retry Strategy

External AI APIs may fail because of:

- network problems
- rate limits
- provider outage
- timeout
- temporary capacity issues

Background jobs can retry with increasing delays.

For example:

```text
Attempt 1 fails
      ↓
wait
      ↓
Attempt 2
      ↓
wait longer
      ↓
Attempt 3
```

After repeated failure, the job can move to a failed-job list for investigation.

---

## Privacy and Sensitive Data

AI introduces an important privacy question.

Call audio and transcripts can contain:

- customer names
- phone numbers
- addresses
- payment-related information
- private conversations
- business information

Before sending this data to an external AI provider, I would confirm:

- whether external processing is allowed
- what data can be shared
- where the data is processed
- how long the provider retains data
- whether customer consent is required
- whether sensitive information should be masked

This is a business and legal decision, not only a technical decision.

---

## Data Redaction

If required, sensitive information could be removed before AI processing.

For example:

```text
Original transcript:

"My card number is 1234..."

        ↓

Redaction

        ↓

"My card number is [REDACTED]"
```

Possible sensitive information includes:

- payment data
- national ID
- passwords
- personal addresses
- account numbers

The exact redaction rules would depend on business requirements.

---

## Language Support

Falaq may have customers who speak different languages.

If Bangla conversations are common, I would specifically test:

- Bangla speech recognition
- mixed Bangla-English conversation
- local accents
- noisy phone audio

A model that works well with clean English audio may not perform equally well with real call-center Bangla conversations.

So model selection should be based on real sample calls and evaluation, not only provider documentation.

---

## AI Quality Evaluation

Before using AI-generated output in important workflows, I would measure its quality.

For transcription, I could evaluate:

```text
word error rate
language accuracy
speaker separation
```

For summaries, I would review:

```text
important details preserved
incorrect information
missing follow-up actions
hallucinated information
```

For routing models, I would monitor:

```text
routing accuracy
agent overrides
customer transfer rate
```

I would not enable an AI feature in production only because it looks good in a small demo.

---

## Human Review

For important AI-generated outputs, I would keep a human review option.

For example:

```text
AI Summary
    ↓
Agent reviews
    ↓
Agent edits if needed
    ↓
Save final version
```

This is especially important when the summary becomes part of the customer's permanent CRM history.

---

## AI Audit Information

For AI-generated results, I would store some metadata.

For example:

```text
model name
model version
processing time
createdAt
review status
```

This helps if the business later needs to understand how a specific result was generated.

I would not rely only on the generated text with no processing history.

---

## Cost Control

AI processing may create significant cost when call volume increases.

For example, if every call has:

```text
audio transcription
summary generation
sentiment analysis
intent detection
```

then one call can trigger several paid AI operations.

I would monitor:

```text
AI cost per call
AI cost per month
average transcript size
processing time
failure rate
```

Some AI features may only need to run for selected calls instead of every call.

---

## AI Rate Limits

External providers normally have usage limits.

At higher call volume, hundreds of completed calls may create many AI jobs at the same time.

A queue helps control this.

For example:

```text
500 jobs created
      ↓
Queue
      ↓
20 workers process gradually
```

This is safer than sending all requests to the provider at once.

---

## Future AI Architecture

A future production architecture may look like:

```text
                    Call Center Backend
                           |
                           |
                           v
                        Queue
                           |
            +--------------+--------------+
            |              |              |
            v              v              v
     Transcription      Summary       Analytics
        Worker           Worker         Worker
            |              |              |
            v              v              v
      Speech Model       LLM         AI Model
            |              |              |
            +--------------+--------------+
                           |
                           v
                       AI Results
                           |
                           v
                         CRM
```

These workers can scale separately from the main call-handling backend.

---

## Why Separate AI Workers Matter

Call traffic and AI workload are different.

For example:

```text
100 agents may be on calls
```

but later:

```text
200 completed recordings may need processing
```

I do not want that AI workload to consume resources needed by active agents.

Separate workers provide better isolation.

---

## AI-Based Quality Assurance

In the future, AI could help supervisors review more calls.

Instead of manually listening to every recording, AI could identify calls with:

```text
negative sentiment
certain keywords
long silence
customer complaint
unusual duration
repeated escalation
```

A supervisor could then review selected calls.

I would use this as a filtering tool, not as the only quality decision-maker.

---

## Future Search Capability

Transcripts can also improve search.

For example, a supervisor may want to find calls where customers mentioned:

```text
refund
delivery problem
payment failure
cancel order
```

A transcript search system could support this.

Later, semantic search or vector search could also be considered.

I would only introduce a vector database if there is a real search use case.

---

## Smart Knowledge Retrieval

A future agent assistant could use company documentation.

For example:

```text
Customer question
      ↓
Search internal knowledge
      ↓
Relevant policy found
      ↓
AI prepares suggested answer
      ↓
Agent reviews
```

This could use retrieval-augmented generation.

However, access control is important.

An agent should not receive internal documents they are not authorized to view.

---

## What I Would Build First

If Falaq decides to add AI after the core platform is stable, I would probably start with post-call features.

My preferred order would be:

1. call transcription
2. automatic summary
3. CRM summary integration
4. sentiment or intent tagging
5. supervisor analytics
6. agent assistance
7. smart routing

I prefer this order because transcription and summaries can provide value without affecting live call routing.

Smart routing has more operational risk, so I would introduce it later after enough real data is available.

---

## What I Would Not Do Initially

I would avoid making AI responsible for:

- deciding whether a call can be accepted
- completing a call
- authentication
- core agent availability
- storing the original call record
- basic call routing from day one

The core system should remain deterministic and reliable.

---

## AI Readiness in the Current Prototype

The current prototype does not implement AI processing.

However, the design already keeps future AI work separate from the core call lifecycle.

For example:

```text
Call completed
      ↓
Call data stored
      ↓
Future event/job
      ↓
AI processing
```

This means future transcription or summarization can be added without changing how agents accept, reject, or complete calls.

---

## Final AI Readiness Approach

My approach is to make the platform ready for AI without making the first version dependent on AI.

The call center should remain fully usable even when no AI service is running.

As the platform evolves, call recordings and call data can be processed asynchronously by dedicated workers for transcription, summaries, sentiment analysis, quality monitoring, and other AI features.

AI providers should stay behind an integration layer, and sensitive customer data should only be processed after privacy and business requirements are confirmed.

For me, AI should improve the agent and supervisor experience, but it should not become a single point of failure for the core call-center system.