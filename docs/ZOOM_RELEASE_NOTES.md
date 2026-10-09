**Release Notes for Zoom Reviewer**

**1. App Overview**
ACRO GROUP Connect is a private educational platform designed for our community. Our platform natively integrates Zoom to host live classes, mentoring sessions, and recurring rooms directly within our web interface using the Zoom Meeting SDK for Web.

**2. How to Test the App**
To effectively review our application, please follow these steps:
- **Login:** Access our platform URL. (If you need a specific test account to bypass onboarding, please refer to the Test Credentials section in our submission).
- **Authorize Zoom (OAuth):** Navigate to the admin/dashboard section and click on "Connect Zoom". This will trigger the OAuth 2.0 flow. 
- **Start a Meeting:** As an authorized host, start a session. Our backend will fetch the ZAK token to seamlessly grant you host privileges within our embedded Zoom Web SDK.
- **Join as a Participant:** Open an incognito window, log in as a standard user (student/lead), and join the meeting. You will join the embedded Web SDK as a participant without needing the native Zoom App.

**3. Specific Features to Notice (Push-to-Talk)**
*Important Note for the QA Team:* We have implemented a proprietary "Push-to-Talk" logic on top of the Web SDK to keep our large classrooms organized. When joining as a participant, the microphone is locally disabled and will only unmute while the user actively holds the on-screen microphone button. The host's mute controls remain unaffected.

**4. Webhook & Attendance Tracking**
We actively listen to Zoom Webhooks (`meeting.started`, `meeting.ended`, `meeting.participant_joined`, `meeting.participant_left`) to track accurate student attendance times down to the second. Our endpoint correctly responds to the `endpoint.url_validation` challenge and uses cryptographic signatures (HMAC) to prevent duplicate processing.

**5. Why we need specific scopes:**
- **`user:read`**: To read the admin's Personal Meeting ID (PMI) so we can create permanent class rooms inside our system.
- **`meeting:write` & `meeting:read`**: To schedule new classes directly from our CRM, read their status, and handle any potential rollbacks.
- **ZAK Token Access**: To allow our instructors to host meetings inside the embedded browser SDK without ever redirecting to the native Zoom client.

Thank you for reviewing ACRO GROUP Connect! Please reach out if you need any additional logs or test environments.
