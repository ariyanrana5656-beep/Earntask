# Security Specification: TaskEarn Pro ("Fortress" Ruleset Validation)

This document outlines the Security Spec, Data Invariants, and the "Dirty Dozen" audit payloads for the TaskEarn Pro platform.

## 1. Data Invariants

1. **User Identity Integrity**: A `UserProfile` can only be created, read, or updated by the authenticated owner (`request.auth.uid == userId`) or an admin user. No user can spoof another user's identifier. The document's `uid` property must strictly match the document reference ID.
2. **Admin Authority**: Only authenticated administrators, represented by a document at `/admins/{userId}`, can create or modify system settings (`/settings/system`), promo codes (`/promoCodes/{promoCodeId}`), active contests (`/contests/{contestId}`), and parent tasks (`/tasks/{taskId}`).
3. **Strict Transition Workflows**: Status and transaction states are terminal or controlled by high-privileged operations. 
   - A task submission status can only be modified by admins. Right after creation, regular users cannot approve their own manual submissions.
   - Payout/Withdrawal requests can only be created by their respective owner with status `pending`. Users are strictly forbidden from field-level state updates once submitted (e.g. changing status to `approved`).
4. **Temporal Authenticity**: All system creation and updates must be validated using `request.time`. Clock spoofing from client payloads must fail.
5. **Data Bound Safety**: All input strings and ID sizes must have strict `.size()` constraints to prevent Denial of Wallet text block injection.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 payloads represent malicious attempts to bypass security checks on TaskEarn Pro. All of these must return `PERMISSION_DENIED` during the security audit.

### Payload 1: Unauthenticated User Profile Creation
*   **Target Collection**: `/users/tg_test_user`
*   **Attack Vector**: Attempting to create a user profile when `request.auth` is `null`.
*   **Payload**:
    ```json
    {
      "uid": "tg_test_user",
      "telegramId": "2837492837",
      "username": "attacker",
      "firstName": "Attacker",
      "lastName": "",
      "photoUrl": "https://api.dicebear.com/7.x/bottts/svg",
      "language": "en",
      "isPremium": false,
      "joinedAt": 1782739281,
      "country": "United States",
      "balance": 999999.0,
      "pendingBalance": 0,
      "coins": 99999999,
      "rewardPoints": 10000,
      "totalEarned": 999999.0,
      "totalWithdrawn": 0,
      "referralEarned": 0,
      "referredBy": null,
      "referralCode": "HACKED",
      "referralCount": 0,
      "completedTasksCount": 0,
      "completedAdsCount": 0,
      "completedSurveysCount": 0,
      "xp": 0,
      "level": 1,
      "vipLevel": 0,
      "rank": 1,
      "lastCheckIn": 0,
      "checkInStreak": 0,
      "isBanned": false
    }
    ```

### Payload 2: Identity Spoofing User Profile Creation
*   **Target Collection**: `/users/alice_uid`
*   **Attack Vector**: Authenticated as `alice_uid`, but trying to set Bob's user identifier inside Alice's profile document.
*   **Payload**:
    ```json
    {
      "uid": "bob_uid",
      "telegramId": "481729384",
      "username": "bob_pro",
      "firstName": "Bob",
      "lastName": "Verified",
      "photoUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      "language": "en",
      "isPremium": false,
      "joinedAt": 1782739281,
      "country": "United States",
      "balance": 1.0,
      "pendingBalance": 0,
      "coins": 1000,
      "rewardPoints": 100,
      "totalEarned": 1.0,
      "totalWithdrawn": 0,
      "referralEarned": 0,
      "referredBy": null,
      "referralCode": "BOBCODE",
      "referralCount": 0,
      "completedTasksCount": 0,
      "completedAdsCount": 0,
      "completedSurveysCount": 0,
      "xp": 10,
      "level": 1,
      "vipLevel": 0,
      "rank": 5,
      "lastCheckIn": 0,
      "checkInStreak": 0,
      "isBanned": false
    }
    ```

### Payload 3: Privilege Escalation (Self-Appointing Admin Role)
*   **Target Collection**: `/admins/alice_uid`
*   **Attack Vector**: Signed-in as a non-admin user (`alice_uid`), attempting to write themselves into the administrators list.
*   **Payload**:
    ```json
    {
      "userId": "alice_uid",
      "grantedAt": 1782739281
    }
    ```

### Payload 4: Task Injection Without Authorization
*   **Target Collection**: `/tasks/free_money`
*   **Attack Vector**: Creating a task document when unauthenticated.
*   **Payload**:
    ```json
    {
      "id": "free_money",
      "title": "Hacked Task",
      "description": "Receive free cash",
      "type": "custom",
      "reward": 100000,
      "rewardPoints": 10000,
      "xpReward": 500,
      "url": "https://hacked-site.com",
      "verificationType": "auto",
      "cooldownHours": 0,
      "dailyLimit": 999,
      "countryFilters": [],
      "deviceFilters": [],
      "isActive": true,
      "createdAt": 1782739281
    }
    ```

### Payload 5: Task Creation by Non-Admin User
*   **Target Collection**: `/tasks/task_xyz`
*   **Attack Vector**: Authenticated as a normal user (`alice_uid`), trying to create a task.
*   **Payload**:
    ```json
    {
      "id": "task_xyz",
      "title": "Malicious task",
      "description": "Normal user writing a system task",
      "type": "website_visit",
      "reward": 5.0,
      "rewardPoints": 50,
      "xpReward": 10,
      "url": "https://google.com",
      "verificationType": "auto",
      "cooldownHours": 24,
      "dailyLimit": 1,
      "countryFilters": [],
      "deviceFilters": [],
      "isActive": true,
      "createdAt": 1782739281
    }
    ```

### Payload 6: Task Submission Identity Spoofing
*   **Target Collection**: `/submissions/attacker_submission`
*   **Attack Vector**: Authenticated as `alice_uid`, but claiming `userId` is `bob_uid` in the submission metadata is banned.
*   **Payload**:
    ```json
    {
      "id": "attacker_submission",
      "taskId": "t1",
      "userId": "bob_uid",
      "telegramUsername": "bob_hacker",
      "submittedAt": 1782739281,
      "status": "pending"
    }
    ```

### Payload 7: Task Auto-Approval Spoofing
*   **Target Collection**: `/submissions/alice_submission`
*   **Attack Vector**: Authenticated as `alice_uid`, submitting a task with predefined state as `approved`, skipping admin review.
*   **Payload**:
    ```json
    {
      "id": "alice_submission",
      "taskId": "t3",
      "userId": "alice_uid",
      "telegramUsername": "alice_gold",
      "submittedAt": 1782739281,
      "status": "approved",
      "screenshotUrl": "https://images.unsplash.com/photo-1611162617213"
    }
    ```

### Payload 8: Withdrawal Record with Negative Amount
*   **Target Collection**: `/withdrawals/with_neg`
*   **Attack Vector**: Authenticated as `alice_uid` requesting withdrawal with negative value to inject negative credits.
*   **Payload**:
    ```json
    {
      "id": "with_neg",
      "userId": "alice_uid",
      "username": "alice_gold",
      "method": "BinancePay",
      "accountDetails": "alice_bin_account",
      "amount": -50.0,
      "status": "pending",
      "requestedAt": 1782739281
    }
    ```

### Payload 9: Self-Approving Withdrawal Payout
*   **Target Collection**: `/withdrawals/with_alice_req`
*   **Attack Vector**: Authenticated as `alice_uid`, updating their own withdrawal request status from `pending` to `approved` to hack checkout.
*   **Payload**:
    ```json
    {
      "id": "with_alice_req",
      "userId": "alice_uid",
      "username": "alice_gold",
      "method": "Nagad",
      "accountDetails": "+8801712000222",
      "amount": 10.0,
      "status": "approved",
      "requestedAt": 1782739281,
      "processedAt": 1782739500
    }
    ```

### Payload 10: Promo Code Injection
*   **Target Collection**: `/promoCodes/promo_hack`
*   **Attack Vector**: Regular consumer writing a promo code that gives millions of free coins.
*   **Payload**:
    ```json
    {
      "id": "promo_hack",
      "code": "FREE10M",
      "rewardValue": 10000000,
      "usageLimit": 999999,
      "usedCount": 0,
      "expiresAt": 1892739281,
      "usedBy": []
    }
    ```

### Payload 11: Support Ticket Identity Trick
*   **Target Collection**: `/tickets/ticket_hack`
*   **Attack Vector**: Creating a Support Ticket with a `userId` pointing to `bob_uid` while user is logged in as `alice_uid`.
*   **Payload**:
    ```json
    {
      "id": "ticket_hack",
      "userId": "bob_uid",
      "subject": "Missing Coins Refund",
      "category": "wallet",
      "status": "open",
      "createdAt": 1782739281,
      "messages": []
    }
    ```

### Payload 12: Unauthorized Settings Hijack
*   **Target Collection**: `/settings/system`
*   **Attack Vector**: Non-admin altering the commission payouts or enabling maintenance mode.
*   **Payload**:
    ```json
    {
      "commissionL1": 100,
      "commissionL2": 50,
      "commissionL3": 25,
      "maintenanceMode": true,
      "telegramBotUrl": "https://t.me/HackedBot",
      "announcement": "System Down! Send coins to attacker!"
    }
    ```

---

## 3. The Test Suite Strategy

We will configure corresponding firebase local or draft security rules variables, validating that each rule returns `PERMISSION_DENIED` on these 12 malicious payloads, keeping the application hardened against any possible exploitation.
