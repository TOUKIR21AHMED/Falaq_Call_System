# Stakeholder Questions

Before starting the actual development, I would first clarify a few things with the business and technical teams.

The assignment gives the main direction of the system, but some important details are still open. These details can affect the architecture, telephony integration, CRM integration, security, and even the MVP scope. So I would not want to assume everything by myself.

---

## Current Business Process

First, I would try to understand how the existing call center works today.

Some questions I would ask are:

- What third-party call center system is currently being used?
- Why does Falaq want to replace it?
- What problems are the agents or management facing with the current system?
- Which existing features are actually important to the team?
- Are there any features in the current system that nobody really uses?
- Roughly how many calls are handled every day?
- What is the maximum number of calls happening at the same time?
- What are the busiest hours of the day?
- Is the call center active 24/7 or only during fixed working hours?

For me, these answers are important because rebuilding an existing product does not mean every old feature needs to be copied.

---

## Agent Workflow

I would also discuss how agents currently work.

For example:

- How many agents will use the first version?
- Is 50 agents the normal expected number, or just the initial maximum?
- When does the company expect to grow toward 500 agents?
- Can one agent handle only one voice call at a time?
- Are agents divided into teams or departments?
- Do some agents have special skills?
- Do agents handle different languages?
- Should agents receive calls based on department, skill, or language?
- Can supervisors manually assign calls?
- Which agent statuses are really needed?

For my prototype, I used:

- Available
- Busy
- Offline

But in the real system, the business may also need statuses such as Break, Training, Away, or After Call Work.

---

## Incoming Calls

For incoming calls, I would first need to understand the telephony side.

Questions I would ask:

- Which telephony provider does Falaq currently use?
- Is there already a SIP or PBX setup?
- Is Asterisk, FreeSWITCH, Twilio, or another service already being used?
- How will the backend receive an incoming call event?
- Will the telephony provider send the caller's phone number?
- What should happen if the phone number does not exist in the CRM?
- Should the system automatically create a new customer?
- How many seconds should an agent get to answer?
- What should happen when the agent does not answer?
- Should the call go to another agent?
- Should it go into a waiting queue?
- Is IVR required before an agent receives the call?

In my prototype, I used a simple 30-second timeout and then marked the call as missed. In production, I would confirm this behavior with the stakeholders instead of keeping it fixed.

---

## Outgoing Calls

The assignment also mentions outgoing calls, so I would ask:

- Should agents start calls directly from the web dashboard?
- Can they call any number or only existing CRM customers?
- Which caller ID should customers see?
- Are outgoing calls always manual?
- Are automated calling campaigns needed later?
- Should failed calls be retried?
- Is a callback scheduling feature required?
- Is click-to-call enough for the first production version?

I did not implement real outgoing telephony in the prototype because the telephony provider has not been defined yet.

---

## Call Routing

Routing is one of the areas I would clarify very early.

I would ask:

- How should the system choose an agent?
- Should it use round-robin?
- Should it choose the least busy agent?
- Should it choose the agent who has been idle for the longest time?
- Do different agents have different skills?
- Should VIP customers get priority?
- Should a returning customer go back to the same agent?
- Should language affect routing?
- What should happen when every agent is busy?
- Should calls wait in a queue?
- How long can a customer wait?
- Can a call move to another team if nobody answers?

For the prototype, I intentionally kept routing simple by selecting one available agent. A real production routing strategy would depend on these business rules.

---

## CRM Integration

The CRM integration also needs clarification before production development.

I would ask:

- Which CRM does Falaq currently use?
- Does it provide REST APIs or another integration method?
- Is API documentation available?
- Which system should be considered the main source of customer data?
- Should the call center keep its own customer copy?
- What customer information does an agent need during a call?
- Should customer data be fetched from the CRM every time?
- Can we cache some data?
- Should call notes automatically go back to the CRM?
- Should the final call disposition also be synchronized?
- Are there any API rate limits?
- What should happen if the CRM is temporarily down?
- Can one customer have more than one phone number?

This part is important because I would not want the core call flow to completely fail just because the CRM is temporarily unavailable.

---

## Call Recording

If recording is required, I would ask:

- Does Falaq need to record every call?
- Are there cases where recording should be disabled?
- Where should recordings be stored?
- How long should they be kept?
- Who can listen to them?
- Does the customer need to be informed before recording?
- Are there any legal or business rules about call recording?
- Should recordings be encrypted?
- Should old recordings be deleted automatically?

I would not treat recording as just another file-upload feature because it has security, storage, and privacy implications.

---

## Call History and Reports

For reporting, I would ask management what information is actually useful.

Questions include:

- How long should call history be kept?
- Which call fields are important?
- Should agents only see their own calls?
- Should supervisors only see their team?
- Should admins see everything?
- Which metrics does management currently care about?
- Are real-time reports required?
- Should reports be exportable?

Possible useful metrics could be:

- Total calls
- Completed calls
- Missed calls
- Rejected calls
- Average call duration
- Average waiting time
- Agent utilization

I would avoid building a large reporting system before knowing which metrics the business actually uses.

---

## Roles and Permissions

I would also confirm the user roles.

For example:

- Is Agent and Admin enough?
- Is a Supervisor role needed?
- Is a Quality Analyst role needed?
- Who is allowed to create agents?
- Who can disable an account?
- Who can change another user's role?
- Who can view customer information?
- Who can listen to call recordings?
- Who can edit call notes?
- Which sensitive actions should be audited?

In my prototype, I kept the roles simple with Agent and Admin.

---

## Authentication and Security

For security, I would ask:

- Will employees use email and password?
- Does the company already have SSO?
- Is Google Workspace or Microsoft login used internally?
- Is MFA required?
- How long should a login session remain active?
- Should users be logged out after inactivity?
- Are there office IP restrictions?
- Will remote agents use VPN?
- Are there compliance requirements for customer data?
- Is audit logging required?

For the prototype, JWT-based authentication is enough to demonstrate the workflow. For production, I would review the final authentication strategy based on Falaq's internal environment.

---

## Scalability

The requirement says the system should grow from around 50 agents to 500+ agents.

I would ask:

- How soon is that growth expected?
- Does 500 agents mean 500 logged-in users or 500 simultaneous active agents?
- How many simultaneous calls should we expect?
- How many calls per day are expected at that scale?
- Will agents work from multiple offices?
- Will remote agents use the same system?
- Is multi-region deployment expected?
- Is high availability required from the first release?
- How much downtime is acceptable?

These answers are more useful than simply saying that the system needs to be scalable.

---

## Failure Scenarios

I would also discuss what should happen when something fails.

For example:

- What happens if an agent's browser disconnects?
- What happens if an agent loses internet during a call?
- What happens if the backend restarts?
- What happens if MongoDB or another database becomes unavailable?
- What happens if the telephony provider is down?
- Should failed events be retried?
- Should supervisors receive alerts when an important service fails?

These cases are easy to ignore during a prototype but very important in a real call center.

---

## Deployment

Before production, I would ask:

- Where does Falaq want to host the system?
- Does the company already use AWS, Azure, GCP, or its own servers?
- Are Docker containers already part of the engineering workflow?
- Are separate development, staging, and production environments required?
- Who will manage the infrastructure?
- What monitoring tools are currently used?
- What logging system is already available?
- How frequently should backups be taken?
- How quickly does the system need to recover after a serious failure?

---

## Future AI Features

The assignment mentions future AI capabilities, so I would clarify what Falaq actually wants first.

Some questions:

- Which AI feature is the highest priority?
- Is speech-to-text required?
- Should transcription happen during the call or after the call?
- Should AI generate a summary automatically?
- Should the summary be saved to the CRM?
- Is sentiment analysis useful to the business?
- Should AI detect customer intent?
- Should agents receive suggested replies?
- Should AI be involved in call routing?
- Which languages need to be supported?
- Is Bangla transcription important?
- Can customer audio be sent to third-party AI services?
- Are there privacy restrictions?
- Should agents review AI-generated summaries before saving them?

I would keep AI processing separate from the live call path so that a slow AI service does not affect normal call handling.

---

## Questions I Would Clarify First

I would not wait for every single question to be answered before starting development.

The first questions I would prioritize are:

1. Which telephony platform will be used?
2. Which CRM is currently being used?
3. What is the expected number of simultaneous calls?
4. How should incoming calls be routed?
5. What should happen when no agent is available?
6. Is call recording required?
7. Which user roles are required?
8. What customer information must be shown to agents?
9. Are there any important security or compliance requirements?
10. Which features are mandatory for the first release?

These answers have the biggest impact on the architecture and MVP scope.

---

## If Some Answers Are Still Unknown

I would not block the whole project just because every detail is not available.

For an unanswered requirement, I would document my assumption and try to keep the implementation flexible.

For example, the actual telephony provider was not specified in this assignment. Because of that, I used a simulated incoming call in the prototype.

The important part for me was to keep the call management logic separate from the telephony-specific part. Later, a real SIP/PBX or telephony provider can replace the simulator without changing the complete application.