# Scalability Plan

## Overview

The first version of the platform is expected to support around 50+ agents, but the same system may need to support 500+ agents later.

I would not design the first version as if it already has millions of users. At the same time, I would avoid decisions that make future scaling unnecessarily difficult.

My approach would be to start simple, measure the real bottlenecks, and then scale the parts that actually need it.

---

## Initial Scale: Around 50 Agents

For around 50 agents, I think a simple architecture is enough.

A practical first production setup could include:

- one React frontend
- one or two Node.js backend instances
- MongoDB
- Socket.IO
- a load balancer if multiple backend instances are used
- basic monitoring and backups

At this scale, I would still prefer a modular monolith instead of splitting everything into microservices.

The main goal is to keep the system simple to deploy, debug, and maintain.

---

## What Can Become a Bottleneck

As the number of agents and calls increases, I would expect bottlenecks in a few specific areas.

These are:

- API traffic
- Socket.IO connections
- agent routing
- database queries
- background jobs
- CRM integration
- telephony events
- reporting and analytics

I would monitor these areas before making major architecture changes.

---

## Horizontal Scaling

The backend should be stateless as much as possible.

This means one request should not depend on data stored only in the memory of one specific server.

If the backend is stateless, I can add more instances behind a load balancer.

For example:

```text
            Load Balancer
                 |
        +--------+--------+
        |                 |
        v                 v
 Backend A           Backend B
        |                 |
        +--------+--------+
                 |
              MongoDB
```

If traffic increases, another backend instance can be added.

```text
            Load Balancer
                 |
       +---------+---------+
       |         |         |
       v         v         v
 Backend A   Backend B   Backend C
```

This is easier than trying to make one large server handle everything.

---

## Socket.IO Scaling

Socket.IO works easily when there is only one backend server.

With multiple backend instances, agent connections may be spread across different servers.

For example:

```text
Agent 1 -> Server A
Agent 2 -> Server B
Agent 3 -> Server C
```

Now imagine an incoming call is processed by Server B, but the assigned agent is connected to Server A.

Server B cannot depend only on its own local socket connections.

To solve this, I would use a shared pub/sub layer such as Redis.

The flow could look like:

```text
Server A
   |
   |
 Redis
   |
   |
Server B
```

Using a Socket.IO Redis adapter, servers can share realtime events.

This means an event created on one backend instance can still reach an agent connected to another instance.

---

## Agent Routing at Larger Scale

The current prototype uses a simple query to find one available agent.

For example:

```text
role = agent
status = available
```

This is enough for a prototype, but it can cause problems when many calls arrive at the same time.

Two requests could potentially select the same available agent before the agent is marked as reserved or busy.

At larger scale, I would make agent reservation atomic.

Possible approaches include:

- atomic database update
- Redis lock
- routing queue
- dedicated routing service
- agent reservation state

The important idea is that one agent should not be assigned to two calls at the same time.

---

## Example of Atomic Reservation

Instead of doing:

```text
1. find available agent
2. assign call
3. update agent status
```

I would prefer an operation that reserves the agent in one safe step.

Conceptually:

```text
Find one agent where:
status = available

At the same time:
change status = reserved
```

If another incoming call tries to select the same agent, that agent is no longer available.

This reduces race conditions.

---

## Additional Agent States

At larger scale, I may introduce another temporary state such as:

```text
available
reserved
busy
offline
```

The `reserved` state can be useful between call assignment and call acceptance.

For example:

```text
available
    ↓
reserved
    ↓
accepted
    ↓
busy
```

If the agent does not answer:

```text
reserved
    ↓
missed
    ↓
available
```

This is more reliable than leaving the agent fully available while a call is already ringing.

---

## Database Scaling

The current MongoDB data model is enough for the prototype.

As call volume grows, database performance becomes more important.

I would first improve query performance using proper indexes.

Likely indexes include:

```text
User.email
User.status
Customer.phone
Call.agent
Call.customer
Call.status
Call.createdAt
```

For call history, a compound index may be useful:

```text
agent + createdAt
```

because agents often need their most recent calls.

Another useful index may be:

```text
status + createdAt
```

for monitoring and reporting.

---

## Pagination

I would not return the complete call history when the database contains a large number of calls.

Instead of:

```text
GET all calls
```

I would use pagination.

For example:

```text
GET /api/calls/history?page=1&limit=20
```

The response could include:

```text
calls
currentPage
totalPages
totalRecords
```

This keeps response sizes smaller and database queries more manageable.

---

## Avoiding Heavy Populate Queries

The prototype uses Mongoose populate because it is convenient.

At larger scale, I would review which fields actually need to be loaded.

For example, call history may only need:

```text
customer name
customer phone
agent name
call status
duration
createdAt
```

I would avoid loading complete customer and agent documents when only a few fields are required.

For reporting-heavy workloads, I may also denormalize some historical information if there is a clear performance benefit.

---

## Data Growth

A call center can generate a large amount of data over time.

Normal call records are relatively small.

But future features may create much larger data such as:

- call recordings
- transcripts
- AI summaries
- audit logs
- analytics data

I would not store large audio recordings directly inside the main database.

A better approach would be:

```text
MongoDB
stores:
recording metadata
recording URL
call relationship

Object Storage
stores:
actual audio file
```

For example, object storage could be S3-compatible storage or another cloud storage service.

---

## Archiving Old Data

Recent operational data and old historical data have different usage patterns.

Agents may frequently access calls from the last few days or weeks.

Calls from several years ago may be needed only for compliance or reporting.

So later, I would consider an archival strategy.

For example:

```text
Recent data
   ↓
Main database

Older data
   ↓
Archive / cheaper storage
```

The exact retention period should come from business and compliance requirements.

---

## Caching

Redis can also be used for frequently accessed temporary data.

Possible examples include:

- agent availability
- agent presence
- routing state
- short-lived customer cache
- rate limiting
- session information
- distributed locks

I would not cache everything.

The cache should be used where it reduces load or improves response time without creating unnecessary consistency problems.

---

## Agent Presence

Agent availability is especially important in a call center.

A database value alone may not always represent whether the agent's browser is actually connected.

For example:

```text
Database says:
Agent = Available

But:
Agent closed browser
```

At larger scale, I would keep a realtime presence layer.

Redis could store something like:

```text
agent:123
status = available
socket = connected
lastSeen = timestamp
```

If the agent disconnects, the system can update presence quickly.

This would make routing more reliable.

---

## Background Job Processing

As the platform grows, I would move slow or retryable tasks outside normal API requests.

Examples include:

- CRM synchronization
- transcription
- AI summary generation
- call recording processing
- sending notifications
- analytics calculations
- retrying failed integrations

The flow could be:

```text
API Request
    ↓
Save important data
    ↓
Add background job
    ↓
Return response
    ↓
Worker processes job
```

This keeps the main call handling fast.

---

## Queue Technology

Since the prototype is based on Node.js, one possible option is BullMQ with Redis.

For example:

```text
Call completed
      ↓
BullMQ Queue
      ↓
Worker
      ↓
CRM Sync
```

Or:

```text
Call completed
      ↓
Queue
      ↓
Transcription Worker
      ↓
AI Summary Worker
```

The specific queue technology can change depending on the final infrastructure.

The important point is that non-critical slow work should not block the call lifecycle API.

---

## Handling Failed Jobs

Background jobs can fail because external services may be temporarily unavailable.

I would use retry policies.

For example:

```text
CRM request fails
      ↓
Retry after delay
      ↓
Fails again
      ↓
Retry with longer delay
```

After a maximum number of failures, the job could move to a dead-letter or failed queue for manual investigation.

This is safer than silently losing the update.

---

## CRM Scaling

If every call directly requests customer data from the CRM, the CRM may become a bottleneck.

For example, hundreds of calls may create many CRM requests.

I would first understand the CRM rate limits and expected response time.

Possible improvements include:

- caching selected customer information
- asynchronous updates
- retry queues
- request throttling
- local customer mapping

I would also avoid making the active call depend completely on the CRM being online.

---

## Telephony Scaling

The telephony provider handles the actual voice connectivity.

The call-center platform mainly handles events and business logic.

At larger scale, I would confirm:

- maximum concurrent calls
- webhook rate limits
- SIP channel capacity
- provider SLA
- failover support
- retry behavior
- regional availability

The telephony layer may need its own scaling strategy depending on the provider.

I would keep that concern separate from the web application.

---

## Load Balancing

When multiple backend instances are running, requests should go through a load balancer.

The load balancer can distribute traffic between healthy instances.

For example:

```text
                  Load Balancer
                       |
         +-------------+-------------+
         |             |             |
         v             v             v
     Backend A     Backend B     Backend C
```

If Backend B becomes unhealthy:

```text
                  Load Balancer
                       |
              +--------+--------+
              |                 |
              v                 v
          Backend A         Backend C
```

Traffic can continue through the remaining healthy instances.

---

## Health Checks

Each backend instance should expose a health endpoint.

For example:

```text
GET /api/health
```

A basic health check can verify that the application process is running.

A deeper health check may also verify dependencies such as:

```text
database connectivity
Redis connectivity
queue connectivity
```

This allows the infrastructure to detect unhealthy instances automatically.

---

## Scaling From 50 to 500 Agents

I would not make the jump from 50 to 500 agents in one architecture rewrite.

I would evolve the system in stages.

### Stage 1 — Around 50 Agents

I would use:

```text
React frontend
Node/Express backend
MongoDB
Socket.IO
basic monitoring
```

A single backend may be enough initially, depending on actual traffic.

---

### Stage 2 — Around 100 to 200 Agents

At this stage, I would likely introduce:

```text
multiple backend instances
load balancer
Redis
Socket.IO Redis adapter
better indexing
pagination
background job queue
```

This removes dependency on one backend instance and improves realtime scaling.

---

### Stage 3 — Around 500+ Agents

At this scale, I would review actual production metrics.

Possible changes may include:

```text
dedicated routing component
stronger agent reservation
separate workers
more database capacity
read replicas if needed
advanced observability
autoscaling
dedicated analytics pipeline
```

I would only split the main backend into independent services if specific modules need separate scaling or ownership.

---

## Why I Would Not Immediately Use Microservices

It is possible to build this system with microservices from day one.

However, I do not think that is automatically the best choice.

For 50 agents, microservices could create unnecessary complexity such as:

```text
many deployments
more network calls
more monitoring
distributed debugging
message brokers
service discovery
more failure points
```

I would first use clear module boundaries inside the application.

If routing later becomes much more demanding than the rest of the system, routing can become a separate service.

If AI processing becomes very heavy, AI workers can scale independently.

The architecture should evolve based on real needs.

---

## Autoscaling

Once the application is containerized and running in suitable infrastructure, backend instances can be scaled automatically.

Possible metrics include:

```text
CPU usage
memory usage
request rate
active connections
queue depth
response latency
```

For this system, I would not rely only on CPU.

Realtime connection count and queue depth may also be important indicators.

---

## Reporting at Larger Scale

Operational APIs and analytics have different workloads.

Agents usually need small, recent datasets.

Management reports may scan large amounts of historical data.

At higher scale, I would avoid allowing heavy reports to negatively affect live call operations.

Possible approaches include:

```text
read replicas
pre-calculated metrics
scheduled aggregation
analytics database
data warehouse
```

I would introduce these only when reporting volume justifies them.

---

## Rate Limiting

Public or sensitive APIs should have rate limits.

Examples include:

```text
login
customer lookup
telephony webhook
admin endpoints
```

Rate limiting can reduce abuse and protect the backend from accidental request spikes.

For distributed backend instances, shared rate-limit state can be stored in Redis.

---

## Reliability During Scaling

Scaling is not only about handling more traffic.

The system also needs to continue working when individual components fail.

I would design for failures such as:

```text
one backend server goes down
Redis temporarily unavailable
CRM is slow
telephony webhook repeated
database query fails
worker crashes
```

For important events, I would make operations idempotent where possible.

For example, if the telephony provider sends the same event twice, the platform should avoid creating duplicate calls.

---

## Idempotency

External systems sometimes retry requests.

For example:

```text
Telephony provider sends event
        ↓
Backend response times out
        ↓
Provider sends same event again
```

Without protection, the platform could create two call records for one real call.

In production, I would store a provider event ID or external call ID.

For example:

```text
providerCallId = abc123
```

Before creating another call, the backend can check whether that call already exists.

This makes integrations safer.

---

## Monitoring During Growth

Before scaling infrastructure, I would collect useful metrics.

Examples include:

```text
active agents
connected sockets
incoming calls per minute
concurrent calls
API response time
database query time
missed call rate
routing failures
queue depth
CRM errors
telephony errors
```

Without these metrics, scaling decisions would mostly be guesses.

---

## Load Testing

Before moving from 50 agents toward 500 agents, I would run load tests.

I would simulate:

- many agents logging in
- many Socket.IO connections
- simultaneous incoming calls
- agent status changes
- call history requests
- admin dashboard requests

I would gradually increase load and identify where latency or failures start increasing.

This would show whether the bottleneck is:

```text
backend CPU
database
Socket.IO
Redis
routing logic
external integrations
```

Then I would scale that specific part.

---

## Security at Larger Scale

As the number of users increases, security controls also become more important.

I would include:

- centralized secret management
- HTTPS everywhere
- strict CORS
- role-based access
- rate limiting
- audit logging
- secure session handling
- database network restrictions
- dependency scanning
- regular backups

Scaling should not reduce security.

---

## My Scaling Strategy in One Flow

The overall strategy is:

```text
Start with simple architecture
        ↓
Measure actual traffic
        ↓
Identify bottleneck
        ↓
Scale backend horizontally
        ↓
Add Redis for shared realtime state
        ↓
Move slow tasks to workers
        ↓
Improve routing coordination
        ↓
Optimize database
        ↓
Separate services only if needed
```

This is the approach I would prefer instead of adding every possible distributed system component from the beginning.

---

## Final Scalability Plan

For the first 50+ agents, I would keep the system relatively simple and focus on reliability.

As usage grows, the first major improvements would be horizontal backend scaling, Redis-backed realtime communication, proper agent reservation, database indexing, pagination, and background job processing.

For 500+ agents, I would use production metrics to decide which components need independent scaling.

The goal is not to make the architecture complicated as early as possible.

The goal is to make sure the system can grow without requiring the entire platform to be rebuilt.