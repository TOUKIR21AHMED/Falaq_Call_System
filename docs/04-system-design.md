# System Design

## Overview

For this prototype, I designed the system as a modular web application instead of trying to build a full telecom platform.

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