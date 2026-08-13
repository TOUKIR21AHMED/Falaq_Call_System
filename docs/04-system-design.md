# System Design

## Overview

For this prototype, I designed the system as a modular web application instead of trying to build a complete telecom platform.

The main purpose of the application is to manage the call-center workflow around a phone call.

The actual phone network or SIP provider is treated as a separate external system.

In simple terms, the application is responsible for:

- knowing which agent is available
- finding the customer
- creating and updating call records
- notifying the correct agent in real time
- tracking the call lifecycle
- storing notes and disposition
- providing basic admin visibility

The real voice connection is outside the prototype.

---

## High-Level Architecture

The prototype currently has the following main parts:

1. React frontend
2. Node.js / Express backend
3. MongoDB database
4. Socket.IO for real-time communication
5. Telephony integration boundary
6. CRM integration boundary
7. Future background processing layer

The current prototype only implements the first four directly.

The telephony and CRM parts are represented in the design because they would be needed in production.

---

## High-Level Flow

A simplified view of the system is:

```text
                    +----------------------+
                    |      Customer        |
                    +----------+-----------+
                               |
                               | Phone Call
                               v
                    +----------------------+
                    | Telephony / SIP / PBX|
                    +----------+-----------+
                               |
                               | Call Event
                               v
+-------------+      +---------+----------+      +-------------+
|   React     | <--> | Node.js / Express  | <--> |   MongoDB   |
|  Frontend   |      |      Backend       |      |             |
+------+------+      +---------+----------+      +-------------+
       ^                       |
       |                       |
       | Socket.IO             | CRM API
       |                       |
       +-----------------------+
                               |
                               v
                    +----------------------+
                    |    Existing CRM      |
                    +----------------------+
```

In the prototype, the telephony event is simulated through an API request.

Later, that simulated event can be replaced by a real telephony provider webhook or SIP/PBX integration.

---

## Why I Chose This Structure

I wanted to keep the main call-center logic separate from external systems.

For example, the core application should not care whether the call comes from Twilio, Asterisk, FreeSWITCH, or another provider.

The telephony system should only send an event such as:

```text
Incoming call from +8801XXXXXXXXX
```

From that point, the call-center application should handle:

```text
customer lookup
        ↓
agent selection
        ↓
call record creation
        ↓
realtime notification
        ↓
call lifecycle
```

This keeps the main business logic easier to maintain.

---

## Frontend Design

The frontend is built with React.

There are currently two main user experiences:

- Agent Dashboard
- Admin Dashboard

The frontend communicates with the backend through REST APIs and Socket.IO.

---

### Agent Dashboard

The agent dashboard handles the main operational workflow.

An agent can:

- log in
- change availability
- receive an incoming call
- accept or reject it
- see customer information
- see live call duration
- add notes
- select disposition
- end the call
- view recent call history

REST APIs are used for actions where the client sends a command to the server.

For example:

```text
Accept Call
    ↓
PATCH /api/calls/:callId/accept
```

Socket.IO is used when the server needs to notify the browser without waiting for the browser to request something.

For example:

```text
Backend assigns call
        ↓
Socket.IO
        ↓
Agent dashboard receives incoming-call
```

---

### Admin Dashboard

The admin dashboard gives a simple operational overview.

Currently it can show:

- total agents
- available agents
- busy agents
- offline agents
- total calls
- completed calls
- ringing calls
- rejected calls
- missed calls
- recent calls

For the MVP, admin statistics can be refreshed periodically.

I did not make every admin metric a real-time Socket.IO event because the aggregate dashboard does not need the same sub-second response as an incoming call.

If real-time wallboard monitoring becomes a requirement, the same Socket.IO infrastructure can be extended for admin events.

---

## Backend Design

The backend is built using Node.js and Express.

I separated the code into areas such as:

```text
controllers
models
routes
middleware
services
config
```

I prefer this over putting all business logic inside route files.

For example:

```text
Route
  ↓
Authentication Middleware
  ↓
Authorization Middleware
  ↓
Controller
  ↓
Database / Service
```

This keeps responsibilities clearer.

---

### Main Backend Modules

The current prototype mainly has these logical modules:

```text
Authentication
Agents
Customers
Calls
Admin
Realtime Communication
```

In a production implementation, I would also add dedicated modules for:

```text
Telephony
CRM Integration
Background Jobs
Reporting
Audit Logging
AI Processing
```

I would keep them separate instead of mixing their logic into the call controller.

---

## Authentication and Authorization

Authentication is handled using JWT in the prototype.

The basic flow is:

```text
Email + Password
       ↓
Backend verifies user
       ↓
JWT generated
       ↓
Client sends token with API requests
```

Protected APIs use authentication middleware.

After verifying the token, the backend loads the current user and attaches the user to the request.

Role-based middleware then checks whether the current user is allowed to access a route.

For example:

```text
Agent
  ↓
Can access agent call APIs

Admin
  ↓
Can access admin monitoring APIs
```

I intentionally do not trust a user ID coming from the frontend when deciding which agent is performing an action.

For example, when an agent changes status, the backend uses the authenticated user from the token instead of accepting an arbitrary agent ID from the request body.

---

## Customer Design

The customer is stored as a separate entity.

For the MVP, the customer contains basic information such as:

```text
name
phone
email
notes
```

The phone number is used to find the customer during an incoming call.

I kept the customer separate from the call record because the same customer may call many times.

Without a separate customer collection, the same customer information would be copied into many call records.

---

## Call Data Model

The Call entity represents one call attempt.

The main fields include:

```text
customer
agent
direction
status
startedAt
endedAt
durationSeconds
notes
disposition
createdAt
updatedAt
```

The relationship is roughly:

```text
Customer
   |
   | 1
   |
   | many
   v
 Call
   ^
   |
   | many
   |
   | 1
 Agent
```

So:

- one customer can have many calls
- one agent can handle many calls over time
- one call belongs to one customer
- one call is assigned to one agent in the current MVP

---

### Why I Store ObjectId References

The Call document stores references to Customer and User documents.

For example:

```text
customer: ObjectId
agent: ObjectId
```

This avoids duplicating the complete customer and agent information in every call record.

When details are required, Mongoose populate is used to load fields such as customer name or agent name.

For a larger production system, I would also think about whether some historical fields should be denormalized if reporting performance requires it.

---

## Call Lifecycle

I treated call status as a controlled lifecycle.

The main incoming flow is:

```text
ringing
   |
   +------> rejected
   |
   +------> missed
   |
   v
accepted
   |
   v
completed
```

The backend checks the current status before allowing an operation.

For example:

```text
Accept allowed only when:
status = ringing

End allowed only when:
status = accepted
```

This is important because the frontend should not be trusted as the source of truth.

Even if a browser shows an Accept button, the backend still checks the actual database state.

---

## Incoming Call Design

The prototype uses an API to simulate an incoming call.

The flow is:

```text
Simulate Incoming Call
        ↓
Find Customer
        ↓
Find Available Agent
        ↓
Create Call
status = ringing
        ↓
Emit incoming-call
through Socket.IO
        ↓
Agent receives popup
```

The selected agent joins a Socket.IO room such as:

```text
agent:<agentId>
```

That allows the server to send the call only to the assigned agent.

It does not broadcast every customer call to every connected browser.

---

## Agent Selection

The prototype currently uses a very simple routing rule:

```text
find one agent
where:
role = agent
status = available
```

This is enough to demonstrate the workflow.

I would not use this as the final production routing algorithm.

A real system may need rules such as:

```text
round-robin
least busy
longest idle
skill-based routing
language-based routing
department routing
priority customer routing
```

The correct strategy depends on the business requirements.

---

### Concurrency Problem in Production

One weakness of a simple `findOne()` approach is concurrency.

For example:

```text
Call A arrives
Call B arrives almost at the same time
```

Both requests could potentially read the same agent as Available before either request updates the agent state.

That could cause two calls to be assigned to one agent.

For production, I would use some form of atomic reservation or distributed coordination.

Possible solutions include:

```text
atomic database update
distributed lock
Redis-based reservation
routing queue
dedicated routing service
```

The exact implementation would depend on the final architecture and traffic level.

---

## Real-Time Communication

Socket.IO is used because some events need to move from the backend to the frontend immediately.

The main prototype events include:

```text
incoming-call
call-missed
```

For example:

```text
Backend
   |
   | incoming-call
   v
Agent Browser
```

When the agent does not answer in time:

```text
Backend
   |
   | update DB → missed
   |
   | call-missed event
   v
Agent Browser
```

This prevents the browser from showing stale ringing state after the backend has already marked the call as missed.

---

## Missed Call Handling

The prototype uses a 30-second timeout.

The flow is:

```text
Call created
status = ringing
       ↓
Wait 30 seconds
       ↓
Still ringing?
   /        \
 yes         no
  |           |
  v           v
missed     do nothing
```

After the call becomes missed, the backend also emits a Socket.IO event to the assigned agent.

The frontend then:

```text
removes incoming call UI
        ↓
shows missed call message
        ↓
refreshes call history
```

For the prototype, this timeout is implemented in the application process.

I would not use this exact solution for production because the timer can disappear if the server restarts.

A better production solution would use a durable queue, scheduled job, or events coming directly from the telephony platform.

---

## Accept Call Flow

When the agent accepts a call:

```text
Agent clicks Accept
        ↓
Backend checks authentication
        ↓
Backend checks assigned agent
        ↓
Backend checks status = ringing
        ↓
status = accepted
startedAt = current time
        ↓
Agent status = busy
```

The frontend then starts the call timer.

---

## Why I Do Not Update the Timer Every Second

The frontend calculates the visible call duration using:

```text
current time - startedAt
```

I do not send a database update every second.

For example, a 10-minute call would otherwise create around 600 unnecessary writes just for a timer.

Instead, when the call ends:

```text
endedAt = current time

duration =
endedAt - startedAt
```

The final duration is stored once.

---

## End Call Flow

When the conversation ends:

```text
Agent enters notes
        ↓
Agent selects disposition
        ↓
Agent clicks End Call
        ↓
Backend verifies call
        ↓
status = completed
endedAt saved
duration calculated
notes saved
disposition saved
        ↓
Agent becomes available
        ↓
History refreshed
```

This completes the call lifecycle.

---

## Database Design

For the prototype I use MongoDB.

The main collections are:

```text
users
customers
calls
```

A simplified structure is:

```text
User
----
_id
name
email
password
role
status
createdAt
updatedAt


Customer
--------
_id
name
phone
email
notes
createdAt
updatedAt


Call
----
_id
customer
agent
direction
status
startedAt
endedAt
durationSeconds
notes
disposition
createdAt
updatedAt
```

---

### Useful Database Indexes

The current MVP is small, but for production I would review indexes based on actual query patterns.

Some likely useful indexes are:

```text
User.email
Customer.phone
Call.agent
Call.customer
Call.status
Call.createdAt
```

Possible compound indexes could also be useful for queries such as:

```text
agent + createdAt
status + createdAt
```

I would not add many indexes blindly because indexes also increase storage and write cost.

---

## CRM Integration Design

The existing CRM should be treated as an external integration.

I would not put direct CRM-specific code everywhere in the application.

I would prefer something similar to:

```text
Call Controller
      ↓
Customer / CRM Service
      ↓
CRM Adapter
      ↓
Existing CRM
```

This provides one clear integration boundary.

If the CRM changes later, the adapter can change without rewriting the whole call-management application.

---

### Example CRM Flow

During an incoming call:

```text
Caller phone
     ↓
Call Center Backend
     ↓
Customer lookup
     ↓
CRM / local cache
     ↓
Customer profile returned
```

After a completed call:

```text
Call completed
     ↓
notes + disposition
     ↓
CRM integration
     ↓
customer activity updated
```

Whether this synchronization should be synchronous or asynchronous depends on the real CRM requirements.

For example, I would probably avoid blocking call completion just because the CRM is temporarily unavailable.

---

## Telephony Integration Design

The telephony provider should also be behind an adapter.

Conceptually:

```text
Telephony Provider
       ↓
Telephony Adapter
       ↓
Call Service
       ↓
Routing
       ↓
Agent
```

Possible providers could include:

```text
Asterisk
FreeSWITCH
Twilio
SIP/PBX provider
```

The application should not require major redesign just because the company changes telephony provider.

---

## Service Communication

For the current MVP, most application modules live inside the same backend.

So internal communication is mainly direct function/service calls.

I prefer this for the initial scale instead of adding network calls between many microservices.

For external systems:

```text
Frontend ↔ Backend
REST + Socket.IO

Backend ↔ MongoDB
Database connection

Backend ↔ CRM
HTTP/API integration

Backend ↔ Telephony
Webhook/API/SIP integration

Backend ↔ Background Workers
Queue/Event system
```

---

## Modular Monolith Instead of Microservices

For the initial 50-agent scale, I would start with a modular monolith.

My reason is mostly operational simplicity.

With microservices, even simple features may require:

```text
multiple deployments
service discovery
network failure handling
distributed tracing
message brokers
more infrastructure
more DevOps work
```

That complexity may not be justified at the beginning.

Instead, I would keep clear module boundaries inside one deployable backend.

If one area becomes a real scaling bottleneck later, it can be separated.

For example:

```text
Initial System

+--------------------------------+
|         Main Backend           |
|                                |
| Auth                           |
| Agents                         |
| Customers                      |
| Calls                          |
| Routing                        |
| Integrations                   |
+--------------------------------+
```

Later:

```text
              API Gateway
                   |
        +----------+----------+
        |          |          |
        v          v          v
 Call Service   Routing    AI Worker
                   |
                   v
              Queue / Redis
```

I would make that change when there is a real reason to do it.

---

## Production-Oriented Architecture

A more production-ready version could look like this:

```text
                          +------------------+
                          |    Customers     |
                          +--------+---------+
                                   |
                                   v
                          +------------------+
                          | Telephony / PBX  |
                          +--------+---------+
                                   |
                                   v
                     +---------------------------+
                     | Load Balancer / API Layer |
                     +-------------+-------------+
                                   |
                 +-----------------+-----------------+
                 |                                   |
                 v                                   v
        +------------------+                +------------------+
        | Backend Instance |                | Backend Instance |
        +--------+---------+                +--------+---------+
                 |                                   |
                 +-----------------+-----------------+
                                   |
                         +---------+----------+
                         | Redis / Shared     |
                         | Realtime State     |
                         +---------+----------+
                                   |
                 +-----------------+------------------+
                 |                                    |
                 v                                    v
        +------------------+                 +------------------+
        |     MongoDB      |                 | Job Queue/Worker |
        +------------------+                 +--------+---------+
                                                       |
                                                       v
                                              +----------------+
                                              | AI / CRM /     |
                                              | Async Tasks    |
                                              +----------------+
```

The prototype does not implement all of these components.

This diagram represents how I would evolve the system when scale and reliability requirements increase.

---

## Scaling Socket.IO

With one backend instance, Socket.IO works directly.

With multiple backend instances, there is a problem.

For example:

```text
Agent connected to Server A

Incoming call processed by Server B
```

Server B may not directly know about the Socket.IO connection on Server A.

A shared pub/sub layer can solve this.

For example:

```text
Server A
   |
   |
 Redis
   |
   |
Server B
```

A Redis Socket.IO adapter would allow realtime events to reach clients connected to different application instances.

---

## Background Processing

Some tasks should not run inside the main API request.

Examples include:

```text
CRM synchronization
call recording processing
transcription
AI summary generation
email notifications
analytics aggregation
retry jobs
```

For those tasks, I would use a queue and worker model.

Example:

```text
Call Completed
      ↓
API saves call
      ↓
Job added to queue
      ↓
API responds immediately
      ↓
Worker processes:
CRM sync / transcription / AI
```

This prevents slow external services from making the agent wait.

---

## Failure Handling

I would try to avoid making one external dependency responsible for the complete call flow.

For example, if the CRM becomes temporarily unavailable, an agent should not necessarily lose the active call.

A possible approach is:

```text
Call completed
      ↓
Call stored locally
      ↓
CRM update attempted
      ↓
CRM unavailable
      ↓
Queue retry
```

The same idea can be used for non-critical AI processing.

---

## Security Considerations

The production architecture should include more than only login authentication.

Important areas include:

```text
HTTPS
role-based authorization
secure secret management
request validation
rate limiting
audit logs
secure cookies or session strategy
password hashing
CORS restrictions
database access control
backup encryption
recording access control
```

The exact requirements would depend on the company's infrastructure and compliance needs.

---

## Logging and Monitoring

A call center system needs good visibility because small failures can directly affect operations.

I would monitor things such as:

```text
API errors
database errors
Socket.IO connections
telephony failures
CRM failures
call assignment failures
queue failures
application latency
missed call rate
```

I would also use structured logs with identifiers such as:

```text
callId
agentId
customerId
requestId
```

This would make it easier to trace one failed call across the system.

---

## Why MERN for the Prototype

The assignment mentions .NET Core and Angular as the preferred stack.

For the prototype, I used React, Node.js, Express, MongoDB, and Socket.IO because I can build and demonstrate the required workflow more effectively with this stack.

The architecture itself is not dependent on MERN.

For example, the backend responsibilities:

```text
authentication
routing
call lifecycle
CRM integration
telephony integration
background processing
```

could also be implemented using ASP.NET Core.

My main goal for the prototype was to demonstrate the system design and working workflow instead of using a technology only at a superficial level.

---

## Current Prototype vs Production

The current prototype intentionally simplifies several areas.

```text
Prototype                  Production Direction
---------------------------------------------------------------
One backend                Multiple backend instances
Simple agent lookup        Proper routing/reservation
MongoDB                    DB chosen by final requirements
Socket.IO single server    Redis/shared Socket.IO adapter
30 sec setTimeout          Durable queue/telephony timeout
Simulated telephony        SIP/PBX/provider integration
Local customer data        CRM integration/sync
JWT prototype auth         Production identity strategy
Manual/basic monitoring    Full observability
```

I think this distinction is important.

The prototype is meant to prove the workflow.

The production architecture should solve reliability and scale problems only when those requirements are confirmed.

---

## Final Design Summary

The design keeps the main call-center workflow simple:

```text
Call arrives
    ↓
Customer identified
    ↓
Agent selected
    ↓
Agent notified
    ↓
Call accepted/rejected/missed
    ↓
Call completed
    ↓
History stored
```

Around that core flow, telephony, CRM, reporting, background jobs, and future AI capabilities are kept as separate concerns.

For the initial scale, I would keep the system as a modular monolith.

As the platform grows toward 500+ agents, I would scale the application horizontally, introduce shared real-time infrastructure, durable job processing, stronger routing coordination, and only extract independent services where there is a real operational reason.