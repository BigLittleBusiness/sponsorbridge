# SponsorBridge: Your DigitalOcean Preparation Checklist

This guide is only about **what you need to do before a developer is invited**. You do not need to create servers, databases, storage buckets, or application services yet.

> **Your goal:** Create and secure the accounts that belong to your business, keep recovery and billing control with you, and record the decisions a developer will need later.

## Before you start

Set aside about **60–90 minutes**. Have your business email address, mobile phone, credit/debit card, password manager, and preferred domain names available.

| You need | Why |
|---|---|
| Business email address | This becomes the owner login and recovery contact. |
| Authenticator app on your phone | Used for multi-factor authentication (MFA). |
| Password manager | Stores recovery codes and future deployment secrets safely. |
| Business payment card | Used for DigitalOcean billing. |
| Preferred web addresses | Lets you decide the production and staging domains. |

## 1. Create the DigitalOcean account in your name

### What to do

1. Go to [DigitalOcean](https://www.digitalocean.com/) and choose **Sign Up**.
2. Register using an email address that **you control personally for the business**. Do not use a developer’s email address.
3. Create a long, unique password using your password manager. Save it in your private vault.
4. Verify the email address when DigitalOcean sends the confirmation email.
5. Complete any requested account or payment verification in the DigitalOcean Control Panel.
6. When asked for a team or project name, use **SponsorBridge**.
7. In your password manager, create an entry named **DigitalOcean — SponsorBridge Owner** and save the sign-in URL, owner email, and password.

### Record this now

| Field | Your answer |
|---|---|
| DigitalOcean owner email |  |
| DigitalOcean team name | SponsorBridge |
| Date account was created |  |

**Done when:** You can sign out, sign back in yourself, and see the DigitalOcean Control Panel.

## 2. Turn on MFA and save recovery codes

DigitalOcean lets you manage multi-factor authentication from **My Account**. [1]

### What to do

1. While signed in, click your profile icon in the top-right corner.
2. Select **My Account**.
3. Find the **Two-Factor Authentication** or **Security** section.
4. Choose **Set Up** or **Enable**.
5. Select an authenticator-app method if available.
6. Open your authenticator app and scan the QR code shown by DigitalOcean.
7. Enter the short verification code from the app to finish setup.
8. When DigitalOcean displays backup/recovery codes, copy them into a secure note in your password manager called **DigitalOcean — SponsorBridge Recovery Codes**.
9. Do not save recovery codes in an ordinary document, email, notes app, or chat message.
10. Test MFA once: sign out and sign back in using the new authenticator code.

### Record this now

| Field | Your answer |
|---|---|
| Authenticator app used |  |
| Recovery codes saved in password manager | Yes / No |
| MFA login tested successfully | Yes / No |

**Done when:** You have completed one successful sign-in using MFA and know where the recovery codes are stored.

## 3. Require secure sign-in for the SponsorBridge team

DigitalOcean team owners can require members to use a secure sign-in method, including DigitalOcean MFA or supported single sign-on methods. [2]

### What to do

1. In the DigitalOcean Control Panel, make sure you are viewing the **SponsorBridge** team.
2. Open the team settings area.
3. Find **Secure sign-in**.
4. Select **Enable Secure Sign-In**.
5. Confirm the change when DigitalOcean asks.
6. Leave this setting on permanently. It means anyone you invite later, including a developer, must use a secure sign-in method.

**Done when:** The SponsorBridge team settings show secure sign-in as enabled.

## 4. Add a second trusted owner or recovery contact

This is optional, but strongly recommended if you have a co-founder, spouse, director, or trusted senior internal person. It protects the business if you lose your phone, become unavailable, or cannot access your email.

### What to do

1. Choose **one person you trust with business and billing authority**. Do not use a contractor or temporary developer for this role.
2. Ask them to create their own DigitalOcean account using their own business email.
3. In the SponsorBridge team settings, open **Members** or **Manage Membership**.
4. Select **Invite Member**.
5. Enter their email address.
6. Give them an **Owner** role only if they are genuinely authorised to manage billing, members, and account recovery. DigitalOcean owners can manage team membership and roles. [3]
7. Ask them to accept the invite and enable MFA on their own account.
8. Save their name, email, and role in your password-manager secure note.

### If you do not have a suitable person

Do not add a developer as your backup owner. Instead, make sure your password manager has emergency-access instructions and that your business records identify who can take over if necessary.

**Done when:** Either you have a verified trusted second owner with MFA, or you have documented why no second owner is currently appropriate.

## 5. Add your business payment method and create a monthly cost reminder

### What to do

1. In DigitalOcean, open **Billing** from the account or team menu.
2. Add a business credit card or debit card that you control. Do not use a developer’s card.
3. Check that the billing name, contact email, and invoice access belong to you or your business.
4. Look for billing notification or alert settings and set a monthly threshold that is appropriate for your launch budget.
5. If the billing screen does not offer the alert you want, create a recurring calendar reminder titled **Review SponsorBridge DigitalOcean bill** on the first business day of each month.
6. Turn on payment-card transaction notifications in your bank app if available.
7. Save the expected initial operating budget in your handover record. The current planning estimate is approximately **US$30/month before GST, currency movement, domain costs, Stripe, and SES**.

### Record this now

| Field | Your answer |
|---|---|
| Billing owner email |  |
| Monthly review date |  |
| Monthly alert/reminder amount |  |
| Payment card owner |  |

**Done when:** You can see the payment method, invoice contact, and a monthly reminder or alert exists.

## 6. Confirm that your other critical accounts are owned by you

You do not need to change anything yet. You only need to confirm that every business-critical account can be recovered by you—not by a developer, former contractor, or personal email you no longer use.

| Account | What to check | Mark complete when |
|---|---|---|
| **Domain registrar** | The account email, MFA, recovery email, renewal payment method, and registrant contact are yours. | You can sign in and see the SponsorBridge domain. |
| **GitHub organisation** | You are an organisation owner for `BigLittleBusiness` and can access the SponsorBridge repository. | You can open the organisation’s People or Settings page. |
| **Stripe** | You control the account owner email, MFA, business details, payout/bank details, and live-mode access. | You can sign in without anyone else’s help. |
| **AWS / SES** | You control the AWS root account email, MFA, billing, and recovery details. | You can reach the AWS account dashboard yourself. |
| **Password manager** | You control the primary email, MFA, emergency access, and account recovery. | You can access your private vault and recovery information. |

### What to do for each account

1. Sign in yourself.
2. Check the account email and recovery email.
3. Confirm MFA is enabled.
4. Confirm the payment method and renewal contact are yours where relevant.
5. Save the account URL and owner email in your password manager.
6. If a developer or old email currently owns the account, do not proceed with deployment until ownership has been transferred to you.

**Done when:** Every row in the table is checked and you can personally sign in to every account.

## 7. Create a secure shared vault called “SponsorBridge — Deployment”

Use your existing password manager. This vault is for deployment information that a developer may need later. It is not for sharing your personal master password, recovery codes, or full-account credentials.

### What to do

1. Open your password manager.
2. Create a new shared vault, folder, or collection named **SponsorBridge — Deployment**.
3. Keep yourself as the owner/administrator of the vault.
4. Do **not** invite a developer yet.
5. Create these empty or placeholder entries inside it:

| Entry name | What it will contain later |
|---|---|
| `DigitalOcean — SponsorBridge Team` | Team URL and limited developer invitation details. |
| `SponsorBridge — Staging Database` | Staging-only database connection details. |
| `SponsorBridge — Production Database` | Production connection details; add only during approved cutover. |
| `SponsorBridge — Spaces Staging` | Staging Spaces credentials. |
| `SponsorBridge — Spaces Production` | Production Spaces credentials. |
| `SponsorBridge — Stripe Test` | Test-mode Stripe values. |
| `SponsorBridge — Stripe Production` | Live Stripe values; add only at production approval. |
| `SponsorBridge — SES` | Scoped SES credentials and sender details. |
| `SponsorBridge — Deployment Recovery` | Links to backups, incident notes, and rollback contacts. |

6. Add a secure note titled **SponsorBridge — Founder Decisions** and copy in the answers from the next section.

**Done when:** The vault exists, you own it, and the placeholder entries are ready. Do not share it until you are ready to start staging work.

## 8. Choose and record your domains and DNS provider

You are only choosing names and recording them. Do not change any DNS records yet.

### What to do

1. Identify where your primary SponsorBridge domain is registered.
2. Decide the public production address. A simple choice is `app.yourdomain.com`.
3. Decide the staging address. A simple choice is `staging.yourdomain.com`.
4. Record who provides DNS. This may be your domain registrar, Cloudflare, DigitalOcean, or another provider.
5. Confirm that changing website DNS later will not accidentally change your email settings. Your email uses **MX records**, which should not be removed when the application website is connected.
6. Save the results in your secure note and in the table below.

| Decision | Your answer |
|---|---|
| Primary domain |  |
| Production app address |  |
| Staging app address |  |
| DNS provider |  |
| Domain registrar |  |
| Registrar owner email |  |
| Email provider |  |
| Do MX records exist? | Yes / No / Unsure |

**Done when:** You know the two addresses you want, know where DNS is managed, and have not changed any DNS records yet.

## Your final founder-only completion check

Before involving a developer, confirm every statement below is true.

- [ ] I own the DigitalOcean account and can sign in with MFA.
- [ ] Recovery codes are safely stored in my password manager.
- [ ] Secure sign-in is enabled for the SponsorBridge team.
- [ ] Billing and monthly cost review are under my control.
- [ ] I have confirmed ownership of my domain, GitHub, Stripe, AWS/SES, and password manager accounts.
- [ ] I have created the **SponsorBridge — Deployment** shared vault but have not shared it yet.
- [ ] I have chosen production and staging web addresses and recorded the DNS provider.
- [ ] I have not given anyone my passwords, recovery codes, MFA codes, or personal email access.

## References

[1]: [DigitalOcean — Manage Two-Factor Authentication](https://docs.digitalocean.com/platform/accounts/2fa/)

[2]: [DigitalOcean — Require Secure Sign-In for Teams](https://docs.digitalocean.com/platform/teams/how-to/require-secure-sign-in/)

[3]: [DigitalOcean — Manage Team Membership](https://docs.digitalocean.com/platform/teams/how-to/manage-membership/)
