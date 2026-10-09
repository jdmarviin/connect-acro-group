ACRO GROUP Connect - Technical Description

Our application integrates Zoom into a Next.js and Payload CMS platform backed by PostgreSQL. The app serves as a centralized hub for both participants and hosts.

Authentication and API Interaction:
Hosts connect their Zoom accounts via OAuth 2.0. Access and Refresh tokens are encrypted and stored safely on our server, never reaching the frontend. The backend uses the Zoom API to schedule meetings with mute upon entry enabled, import Personal Meeting IDs, and retrieve ZAK tokens. The ZAK tokens automatically grant our admins Host privileges inside the platform.

Embedded Meeting Experience:
We embed the Zoom Meeting SDK for Web directly into our interface. Our server generates SDK signatures only after validating the user role and trial status. We also implemented a proprietary Push-to-Talk feature on top of the SDK. This keeps participant microphones disabled locally until the user intentionally holds a button, fully respecting Zoom API limits.

Webhooks and Tracking:
We heavily rely on Zoom Webhooks to monitor meetings. We subscribe to events for meeting start, meeting end, participant joined, and participant left. This allows us to track exact attendance durations down to the second. Our webhook endpoints are highly secure: we validate the secret token, verify HMAC signatures, reject stale requests, and use database transactions to prevent duplicate events.

Required Scopes:
We request meeting read and write scopes to schedule and manage events, user read scopes to fetch profiles and import personal meeting IDs, and ZAK token access to authenticate our hosts seamlessly within the embedded SDK.
