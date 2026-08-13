# Requirement Analysis — Falaq In-House Call Center Platform

## 1. Introduction

Falaq Digital plans to replace its reliance on a third-party call center service provider by deploying an internally owned and operated call center system.

This will consist of a single integrated interface that would be used by humans for handling incoming/outgoing customer calls, accessing customer details, recording call results, and interacting with the current CRM system.

The starting system needs to accommodate up to 50+ agents, although the system design must accommodate future scalability beyond 500+ agents.

Finally, the architectural design needs to facilitate the implementation of future AI capabilities like transcription, summarization, sentiment analysis, quality management, and intelligent call routing.

---

## 2. Business Goals

These are the core business objectives behind the platform:

* Reduce reliance on external call center software.
* Exercise better control over call center processes and customer information.
* Enable a single location for agents to work.
* Facilitate better integration with the current CRM of Falaq.
* Have full history of calls.
* Gain insights into the availability of agents and calls.
* Support the scalability of the business from more than 50 to more than 500 agents.
* Develop a framework that can facilitate future developments with AI.
* Allow the replacement of telephony vendors without having to re-develop the entire application.

---

## 3. Primary Stakeholders

### 3.1 Call Center Agents

The agents are the main end-users of the system.

They must be able to:

* Log in to the system.
* Update their availability status.
* Get notified of inbound calls.
* Accept or reject assigned calls.
* Check customer information.
* Place outbound calls.
* Enter call notes.
* Determine the call disposition.
* Check their call history.

### 3.2 Call Center Supervisors / Managers

Visibility is required for supervisors overseeing the call centers.

This may be necessary for:

* Availability of agents.
* Monitoring active and previous calls.
* Evaluating missed/rejected calls.
* Evaluating agent performance.
* Viewing operational reports.
* Resolving any customer service problems.

### 3.3 System Administrators

Administrators will have the responsibility to oversee platform configuration and access management.

This might include the following duties:

* Management of agents.
* Role and permissions management.
* System configuration management.
* Platform monitoring.
* Integration management.

### 3.4 Customers

The customer connects with the platform indirectly through telephone calls.

The platform needs to offer customers:

* Call connection reliability.
* Short waiting time.
* Consistency in services.
* Proper handling of the customer’s previous records.

### 3.5 CRM / Business Operations Team

The current CRM will interact with the new call center system by exchanging customer information and call details.

The role of the CRM team will be crucial for:

* Customer data integration.
* API access.
* Data synchronization.
* System of record definition.

### 3.6 Engineering / DevOps Team

The engineering and DevOps teams will manage the application.

They need:

* Architecture that can be maintained.
* Logging and monitoring.
* Reliable deployment.
* Security controls.
* Backup and recovery.
* Scalability measures.

---

## 4. Functional Requirements

### 4.1 Authentication and Authorization

The System Shall:

* Allow a logged-in session for authenticated users.
* Authenticate the user.
* Provide role based authentication.
* Prevent the agent from using administrative functions.
* Secure customer and call information from unauthorized access.

Roles as of now:

* Agent
* Admin

Future roles may be:

* Supervisor
* Quality Analyst
* Operations Manager

---

## 4.2 Agent Management

The system should enable an agent to have an active status.

List of MVP statuses:

* Available
* Busy
* Offline

The agent’s status will be utilized by the call routing system to determine the list of eligible agents for receiving calls.

If an agent receives a call, then the agent status becomes busy.

After finishing a call, the status becomes available.

---

## 4.3 Customer Management

The system should:

* Store customer data.
* Identify customers using the phone number.
* Show customer data on the call.
* Enable authorized personnel to access the customer records.
* Link the customers to their previous calls.

For the MVP, the phone number will be the key identifier for the customers.

A production version of the system needs to use standardized phone numbers across the world.

---

## 4.4 Incoming Call Handling

The system shall implement the following inbound call flow:

1. Get the event of the incoming call from the telephony layer.
2. Detect the phone number of the calling party.
3. Get the customer profile.
4. Choose a suitable available agent.
5. Make the call log.
6. Notify the chosen agent instantly.
7. Let the agent answer or ignore the call.
8. Mark the ignored calls as missed after the configurable timeout period.
9. Log the result of the call.

The prototype will emulate the telephony event rather than make a real telephone call.

The system architecture shall allow for later replacement of the emulated telephony part with a real one in the future.

---

## 4.5 Outgoing Call Handling

The production system must permit agents to make outgoing calls based on the customer profile.

The future expected flow would be:

1. Agent chooses the customer.
2. Agent makes an outgoing call.
3. Backend calls telephony provider to place the call.
4. The call gets recorded.
5. Lifecycle of call gets monitored.
6. Notes/disp get updated after ending the call.

A full outgoing telephony functionality would not be covered by the prototype.

---

## 4.6 Call Lifecycle Management

A call may transition through different states.

For the MVP:

`ringing → accepted → completed`

or:

`ringing → rejected`

or:

`ringing → missed`

The system shall prevent invalid state transitions.

For example:

* A completed call cannot be accepted again.
* A missed call cannot be accepted.
* Only an accepted call can be completed.

---

## 4.7 Call Information

The system will keep data such as:

* Customer
* Agent assigned
* Call direction
* Call status
* Time call created
* Time conversation started
* Time ended
* Length of time
* Notes
* Disposition

MVP dispositions to support:

* Resolved
* Follow up
* Not interested
* Wrong number
* Other

---

## 4.8 Call History

The agent must have access to his/her call log.

The administrator must have access to all call logs on the system.

The recently placed calls must show data such as:

* Customer
* Agent
* Direction
* Status
* Duration
* Disposition
* Date and time

---

## 4.9 Real-Time Communication

The solution should offer real-time communication between the backend and connected agent software applications.

Some of the real-time events would be:

* Notification of incoming call
* Notification of missed call
* Changes in call state
* Changes in agent state

The prototype utilizes Socket.IO for the above requirement.

---

## 4.10 Administrative Monitoring

The following information should be visible to the administrator in a simple dashboard:

* Total agents
* Active agents
* Busy agents
* Offline agents
* Total calls
* Completed calls
* In-progress calls
* Rejected calls
* Missed calls
* Recent calls

Advanced analytics will not be included in the MVP.

---

## 4.11 CRM Integration

The solution should feature an exclusive interface for the interaction with the existing CRM system.

CRM System Integration Scenarios are:

* Customer Profile Retrieval.
* Customer Data Updates.
* Call Notes Delivery.
* Call Results Delivery.
* Customer Identifiers Synchronization.

The specific approach to integration should be identified based on the capabilities of the existing CRM system.

---

## 5. Non-Functional Requirements

### 5.1 Scalability

The first deployment must provide for about 50+ agents.

The system architecture must provide for scaling to 500+ agents in the future by:

* Stateless application servers.
* Horizontal scalability.
* Load balancing.
* Caching and presence management.
* Real-time distributed communication.
* Background task execution.
* Database indexing.
* Connection management.

---

## 5.2 Availability

The call center software is very important from an operational standpoint.

The production environment should have as little downtime as possible and should be protected against any single points of failure, wherever feasible.

Key services must be capable of:

* Health monitoring.
* Detection of failures.
* Restarting applications.
* Backing up data.
* Recovery of lost data.

---

## 5.3 Performance

The responses to normal user actions should be fast under expected load.

Real-time call notification must be delivered with minimal delay.

Operational database queries should use proper indexing.

Expensive data analysis or AI processing should not block the call-processing requests.

---

## 5.4 Security

The system needs to:

* Be authenticated.
* Have role-based authorization implemented.
* Hash user passwords for storage.
* Secure APIs using tokens or sessions.
* Use HTTPS.
* Keep secrets outside of the source code.
* Sanitize inputs.
* Rate limit where applicable.
* Limit administrative capabilities.
* Have appropriate auditing.

Authentication should take into account secure HttpOnly cookies or another similar secure session implementation for production environment.

---

## 5.5 Data Privacy

Customer details and call logs need to be considered as confidential business information.

Access should be restricted based on user role and other operational needs.

Call recordings, storage, transcriptions, and AI processing should adhere to all relevant laws and contracts.

---

## 5.6 Maintainability

Implementation should ensure separation between major areas such as:

* Authentication
* Agent management
* Customer management
* Call management
* Telephony Integration
* CRM integration
* Reporting
* Future AI processing

Such separation would facilitate the evolution of each component without impacting other components unnecessarily.

---

## 5.7 Observability

The production system should include:

* Structured application logging.
* Monitoring of errors.
* API performance monitoring.
* Infrastructure monitoring.
* Database monitoring.
* Monitoring of call processing events.

Critical failure alerts need to be defined.

---

## 6. Assumptions

Due to lack of all the implementation details from the initial business description, the below assumptions were made for the first version of the design.

1. The system will be accessed mostly by the internal Falaq employees.

2. The agents will use a modern web browser to access the platform.

3. There is an API or other form of integration available for the existing CRM.

4. At the end, there will be a telephony provider, SIP/PBX platform or any other solution that can offer real phone connectivity.

5. Real voice transmission is not required for this prototype.

6. One customer can make several calls.

7. One agent can serve several calls.

8. Normally, one agent can serve only one voice call.

9. First deployment will have about 50+ agents.

10. Target architecture should scale up to 500+ agents.

11. AI capabilities will be a part of future requirements, but not part of MVP.

12. Call timeout time should be configurable instead of fixed 30 seconds.

13. Customer phone numbers should be normalized in production.

14. CRM synchronization will depend on the existing CRM and stakeholder's decision.

---

## 7. Constraints

The known limitations are:

* In the original request, the preferred technologies are .NET Core and Angular.
* The prototype uses the MERN stack.
* The real telephony system is not included in the prototype.
* The assignment should be done in a certain time frame.
* Enterprise-level infrastructure cannot be realistically built into the prototype.
* The exact functionalities of CRM are still unknown.
* The exact specifications of the telephony provider are still unknown.

---

## 8. Risks

### 8.1 Telephony Vendor Dependency

APIs, events, and SIP support vary by telephony service provider.

**Mitigation:** Utilize a telephony adapter or integration layer to prevent tight coupling between core call management and a particular vendor.

### 8.2 CRM Integration Complexity

The CRM could potentially have API limitations, rate limits, inconsistent identifiers, or synchronization limitations.

**Mitigation:** Ensure that the CRM is properly separated into a service layer and that customer data ownership is defined before implementation.

### 8.3 Concurrent Call Assignment

Under heavy loads, two simultaneous requests can try to allocate the same available agent.

**Solution:** Atomic allocation of agents for production routing is a way out.

### 8.4 Real-Time Scaling

One single Socket.IO server suffices for the prototype but would not work for several horizontally scaled application instances.

**Mitigation:** Shared Redis adapter or similar publish-subscribe system can be used between realtime server instances.

### 8.5 In-Process Timeout Reliability

For the prototype, the application level timeout is set for missed calls.

The application restart may cancel the in-memory timer.

**Mitigation:** The production call expiration job must rely on a durable queue or telephony event source.

### 8.6 Data Explosion

Call logs, recordings, transcriptions, and analytics may explode quickly.

**Mitigation:** Employ database indexing, pagination, archiving policies, object storage, and data retention policies.

### 8.7 Cost and Latency for AI Processing

Transcription and future AI processing may be costly and delayed compared to regular API requests.

**Mitigation:** Do AI operations asynchronously and out of the real-time request processing of calls.

---

## 9. Out of Scope for the MVP

The following are deliberately left out of the early prototype version:

* Actual telephone voice connection.
* Complete implementation of SIP/PBX.
* Implementation of production telephony vendor.
* Call recording.
* IVR.
* Call queues.
* Skill-based routing.
* Complete implementation of outbound calls.
* Integration with production CRM.
* AI transcription.
* AI call summarization.
* Sentiment analysis.
* AI call routing.
* Advanced analytics.
* Workforce management.
* QA tools.
* Deployment across multiple regions.
* Telephony cost/billing management.

The above functionality can gradually be added as the core call center functionality is verified.

---

## 10. MVP Success Criteria

The MVP would be successful if it is able to demonstrate the following workflow:

1. Authentication of an agent.
2. Change in availability of an agent.
3. Existence of a customer in the system.
4. Simulating a call.
5. Selection of an available agent.
6. Call receiving by the agent in real time.
7. Accepting or rejecting the call by the agent.
8. Unanswered calls become missed.
9. Accepted call records conversation time.
10. Notes entry and disposition by the agent.
11. End the call by the agent.
12. Call in the call history.
13. Monitoring of agents and call statistics by an administrator.

This MVP proves the core business process without the need for production telephony systems.
