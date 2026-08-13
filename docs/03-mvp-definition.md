# MVP Definition

## What I Consider the MVP

For this assignment, I would not try to build a complete call center product in the first version.

A full call center platform can become very large very quickly because it may include telephony, IVR, call queues, call recording, reporting, CRM synchronization, workforce management, AI features, and many other things.

So for the MVP, I focused only on the core workflow that proves the system can actually work.

The main idea is simple:

An agent should be able to log in, become available, receive an incoming call, handle that call, and save the final call information.

If that flow works properly, then the platform has a strong base for adding more advanced features later.

---

## Main Goal of the MVP

The main goal of the MVP is to validate the basic call-handling workflow without depending on real telephony infrastructure.

The MVP should prove that:

- Agents can authenticate securely
- Agent availability can be tracked
- Incoming calls can be assigned
- Calls can be received in real time
- Agents can accept or reject a call
- Unanswered calls can become missed calls
- Active calls can be tracked
- Notes and disposition can be saved
- Call history can be viewed
- Admins can monitor the overall system

I intentionally kept the scope around these areas because they represent the core operational workflow.

---

## Features Included in the MVP

### 1. Authentication

The MVP includes login and role-based access.

For now, I use two roles:

- Agent
- Admin

Agents can access the agent dashboard, while admins can access the admin dashboard.

I kept the role model simple because the assignment mainly needs a working prototype, not a complete enterprise permission system.

In a production system, roles such as Supervisor or Quality Analyst could be added later.

---

### 2. Agent Availability

Agents can change their status between:

- Available
- Busy
- Offline

This is important because the call-routing logic needs to know which agent can receive a new call.

For the MVP, I use a simple available-agent lookup.

In production, this should be replaced by a more reliable routing and reservation strategy.

---

### 3. Customer Information

The MVP stores basic customer information such as:

- Name
- Phone number
- Email
- Notes

When an incoming call is created, the system searches for the customer using the phone number.

I used the phone number because it is the most natural identifier available during an incoming phone call.

For a real system, phone numbers should be normalized and one customer may also have multiple numbers.

---

### 4. Simulated Incoming Call

The biggest simplification in my prototype is the telephony layer.

Instead of connecting a real phone network, I simulate an incoming call through an API.

This is intentional.

The actual assignment does not specify which SIP, PBX, or telephony provider will be used, so I did not want to tightly couple the prototype to one provider.

The simulation lets me demonstrate the call management workflow while keeping the telephony part replaceable later.

---

## Incoming Call Flow

The MVP incoming call flow is:

1. A call is simulated using a customer phone number.
2. The backend finds the customer.
3. The backend searches for an available agent.
4. A call record is created with `ringing` status.
5. The selected agent receives the call through Socket.IO.
6. The agent can accept or reject the call.
7. If nobody accepts within 30 seconds, the call becomes missed.
8. The call is saved in call history.

This is enough to demonstrate the main call-routing concept without building real telecom infrastructure.

---

## Real-Time Notification

I use Socket.IO for real-time communication.

For example, when a call is assigned to an agent, the backend sends an `incoming-call` event directly to that agent's room.

The agent does not need to refresh the browser.

The same idea is used for missed calls.

If a ringing call expires, the backend updates the database and sends a real-time event so the frontend also updates immediately.

This keeps the backend as the source of truth while still giving the agent a live experience.

---

## Accepting a Call

When the agent accepts a ringing call:

- The call status changes from `ringing` to `accepted`
- The conversation start time is saved
- The agent becomes `busy`

The frontend then starts showing the active call state.

I only allow a call to be accepted while its status is `ringing`.

This prevents invalid actions such as accepting an already completed or missed call.

---

## Rejecting a Call

An agent can reject a call assigned to them.

When that happens:

- The call becomes `rejected`
- The end time is stored
- The call appears in call history

The backend also checks that the authenticated agent is actually the agent assigned to that call.

This prevents one agent from changing another agent's call.

---

## Missed Calls

For the prototype, an unanswered call becomes missed after 30 seconds.

The flow is:

`ringing -> missed`

The 30-second value is only a prototype decision.

In a production system, I would make this configurable and confirm the correct timeout with the operations team.

For the prototype, I use a simple application timer.

I would not use this exact method for production because an in-memory timer can be lost if the backend restarts.

A durable background job or telephony event would be more suitable in production.

---

## Active Call Handling

When a call is accepted, the agent can see:

- Customer name
- Phone number
- Email
- Call direction
- Live call duration

The call timer is calculated in the frontend using the saved `startedAt` time.

I do not update the database every second.

That would create unnecessary database writes.

The final duration is calculated and saved only when the call ends.

---

## Ending a Call

When the agent finishes the conversation, they can add:

- Call notes
- Disposition

The available dispositions in the MVP are:

- Resolved
- Follow Up
- Not Interested
- Wrong Number
- Other

After ending the call:

- Status becomes `completed`
- End time is saved
- Duration is calculated
- Notes are stored
- Disposition is stored
- Agent becomes available again

The completed call then appears in call history.

---

## Call History

Agents can view their own call history.

An agent should not see another agent's private operational history by default.

Admins can view calls across the system.

The current history includes useful information such as:

- Customer
- Call direction
- Status
- Duration

This is enough for the MVP.

More advanced filtering, search, pagination, and reporting can be added later.

---

## Admin Dashboard

The MVP also contains a basic admin dashboard.

The admin can see:

- Total agents
- Available agents
- Busy agents
- Offline agents
- Total calls
- Completed calls
- Ringing calls
- Rejected calls
- Missed calls
- Recent call activity

I did not build a large analytics system because that would add scope without proving the main call-center workflow.

The admin dashboard is mainly there to show basic operational visibility.

---

## What I Did Not Include in the MVP

There are several features that would be useful in a real call center but are intentionally not part of this prototype.

These include:

- Real SIP/PBX integration
- Real voice calling
- IVR
- Call queue
- Advanced routing
- Call recording
- Outgoing telephony
- Full CRM integration
- Supervisor dashboard
- Advanced reporting
- Export features
- Call transfer
- Hold functionality
- Voicemail
- AI transcription
- AI summaries
- Sentiment analysis
- Smart routing

I excluded these because the goal of the prototype is to validate the main architecture and call lifecycle, not to rebuild a complete commercial call center platform.

---

## Why I Did Not Build Real Telephony

This was an important scope decision.

Real telephony depends heavily on the provider and infrastructure.

For example, the implementation could be different depending on whether Falaq uses:

- Asterisk
- FreeSWITCH
- Twilio
- SIP trunks
- Another PBX provider

Since that information is not confirmed in the assignment, I kept telephony outside the core logic.

The prototype sends a simulated incoming event instead.

Later, that simulator can be replaced with a real telephony adapter.

The main call management logic should not need to be rewritten.

---

## Why I Did Not Start With Microservices

For around 50 agents, I would not immediately split this MVP into many independent microservices.

That would increase:

- Deployment complexity
- Debugging difficulty
- Network communication
- Operational overhead

For the first version, I prefer a modular monolith with clear separation between areas such as:

- Authentication
- Agents
- Customers
- Calls
- Telephony integration
- CRM integration

If the system grows and some modules need independent scaling, they can be extracted later.

For me, microservices should solve a real scaling or organizational problem, not just be used because the system may become large in the future.

---

## What Makes This MVP Successful

I would consider the MVP successful if I can demonstrate the following flow during the interview:

1. Login as an agent
2. Set the agent to Available
3. Create or use an existing customer
4. Simulate an incoming call
5. Receive the call instantly on the agent dashboard
6. Accept the call
7. See the live call timer
8. Add notes and disposition
9. End the call
10. See the completed call in history

I should also be able to demonstrate:

- Rejecting a call
- Letting a call become missed
- Admin monitoring agent and call activity

If these workflows work correctly, then the MVP proves the core idea of the system.

---

## What I Would Build Next

If this MVP was approved, my next priorities would depend on the business requirements.

I would most likely move toward:

1. Real telephony integration
2. Proper call queue and routing
3. CRM integration
4. Supervisor functionality
5. Better monitoring and reporting
6. Call recording, if required
7. Durable background jobs
8. Production security improvements
9. Horizontal scaling
10. AI features

I would not choose the exact order without discussing business priority first.

---

## Final MVP Decision

My goal with this prototype was not to show the maximum number of features.

I wanted to show that the most important call-center workflow can be designed and implemented in a clear way.

The prototype demonstrates authentication, agent availability, customer lookup, real-time call assignment, call lifecycle handling, call history, and basic admin monitoring.

At the same time, uncertain parts such as telephony, CRM, advanced routing, and AI are kept outside the core implementation so they can be added later without redesigning the whole system.