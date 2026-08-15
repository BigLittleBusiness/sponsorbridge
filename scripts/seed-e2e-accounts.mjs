import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const TEST_TENANT_SUBDOMAIN = "e2e-sponsorbridge";
const TEST_TENANT_NAME = "SponsorBridge E2E Test Charity";
const STAFF_EMAIL = "e2e.staff@sponsorbridge.test";
const SPONSOR_EMAIL = "e2e.sponsor@sponsorbridge.test";
const ADMIN_EMAIL = "e2e.admin@sponsorbridge.test";
const STAFF_OPEN_ID = "e2e-staff-user";
const SPONSOR_OPEN_ID = "e2e-sponsor-user";
const ADMIN_OPEN_ID = "e2e-admin-user";

function requireSafeConfiguration() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed browser-test accounts when NODE_ENV is production.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed browser-test accounts.");
  }
  if (!process.env.E2E_TEST_PASSWORD) {
    throw new Error("E2E_TEST_PASSWORD is required to seed browser-test accounts.");
  }
}

async function findId(connection, table, where, values) {
  const [rows] = await connection.execute(`SELECT id FROM ${table} WHERE ${where} LIMIT 1`, values);
  return rows[0]?.id ?? null;
}

async function main() {
  requireSafeConfiguration();
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const passwordHash = await bcrypt.hash(process.env.E2E_TEST_PASSWORD, 12);

  try {
    await connection.execute(
      `INSERT INTO tenants (name, subdomain, primaryColor, secondaryColor, isActive)
       VALUES (?, ?, '#C1440E', '#F4A261', true)
       ON DUPLICATE KEY UPDATE name = VALUES(name), isActive = true`,
      [TEST_TENANT_NAME, TEST_TENANT_SUBDOMAIN],
    );
    const tenantId = await findId(connection, "tenants", "subdomain = ?", [TEST_TENANT_SUBDOMAIN]);

    const seedUser = async ({ openId, email, name, role, isSystemAdmin = false }) => {
      await connection.execute(
        `INSERT INTO users (openId, tenantId, name, email, loginMethod, role, isActive, lastSignedIn)
         VALUES (?, ?, ?, ?, 'e2e', ?, true, NOW())
         ON DUPLICATE KEY UPDATE tenantId = VALUES(tenantId), name = VALUES(name), email = VALUES(email), role = VALUES(role), isActive = true`,
        [openId, tenantId, name, email, role],
      );
      return findId(connection, "users", "openId = ?", [openId]);
    };

    const staffUserId = await seedUser({
      openId: STAFF_OPEN_ID,
      email: STAFF_EMAIL,
      name: "E2E Staff",
      role: "program_manager",
    });
    const sponsorUserId = await seedUser({
      openId: SPONSOR_OPEN_ID,
      email: SPONSOR_EMAIL,
      name: "E2E Sponsor",
      role: "sponsor",
    });
    await seedUser({
      openId: ADMIN_OPEN_ID,
      email: ADMIN_EMAIL,
      name: "E2E System Admin",
      role: "system_admin",
      isSystemAdmin: true,
    });

    const seedCustomAccount = async ({ email, firstName, lastName, isSystemAdmin }) => {
      await connection.execute(
        `INSERT INTO custom_accounts (tenantId, orgName, orgCountry, orgWebsite, orgSize, firstName, lastName, jobTitle, email, passwordHash, isVerified, planTier, onboardingCompletedAt, isSystemAdmin)
         VALUES (?, ?, 'Australia', 'https://example.test', '11-50', ?, ?, 'E2E Test Account', ?, ?, true, 'professional', NOW(), ?)
         ON DUPLICATE KEY UPDATE tenantId = VALUES(tenantId), passwordHash = VALUES(passwordHash), isVerified = true, onboardingCompletedAt = NOW(), isSystemAdmin = VALUES(isSystemAdmin)`,
        [tenantId, TEST_TENANT_NAME, firstName, lastName, email, passwordHash, isSystemAdmin],
      );
    };

    await seedCustomAccount({ email: STAFF_EMAIL, firstName: "E2E", lastName: "Staff", isSystemAdmin: false });
    await seedCustomAccount({ email: ADMIN_EMAIL, firstName: "E2E", lastName: "Admin", isSystemAdmin: true });

    await connection.execute(
      `INSERT INTO sponsors (tenantId, userId, firstName, lastName, email, country, communicationStyle, isActive)
       VALUES (?, ?, 'E2E', 'Sponsor', ?, 'Australia', 'occasional', true)
       ON DUPLICATE KEY UPDATE userId = VALUES(userId), isActive = true`,
      [tenantId, sponsorUserId, SPONSOR_EMAIL],
    );
    const sponsorId = await findId(connection, "sponsors", "tenantId = ? AND email = ?", [tenantId, SPONSOR_EMAIL]);

    await connection.execute(
      `INSERT INTO sponsor_portal_accounts (sponsorId, tenantId, email, passwordHash, isVerified, isActive)
       VALUES (?, ?, ?, ?, true, true)
       ON DUPLICATE KEY UPDATE sponsorId = VALUES(sponsorId), passwordHash = VALUES(passwordHash), isVerified = true, isActive = true`,
      [sponsorId, tenantId, SPONSOR_EMAIL, passwordHash],
    );

    let childId = await findId(connection, "children", "tenantId = ? AND firstName = 'E2E' AND lastName = 'Student'", [tenantId]);
    if (!childId) {
      const [result] = await connection.execute(
        `INSERT INTO children (tenantId, firstName, lastName, gender, country, bio, status, schoolName, healthStatus, parentalConsentGranted, photoConsentGranted, videoConsentGranted, isActive)
         VALUES (?, 'E2E', 'Student', 'other', 'Australia', 'A non-production child profile used only for browser testing.', 'SPONSORED', 'E2E Learning Centre', 'Healthy', true, true, true, true)`,
        [tenantId],
      );
      childId = result.insertId;
    } else {
      await connection.execute(
        "UPDATE children SET status = 'SPONSORED', isActive = true WHERE id = ?",
        [childId],
      );
    }

    let sponsorshipId = await findId(connection, "sponsorships", "tenantId = ? AND sponsorId = ? AND childId = ?", [tenantId, sponsorId, childId]);
    if (!sponsorshipId) {
      const [result] = await connection.execute(
        `INSERT INTO sponsorships (tenantId, sponsorId, childId, status, matchedBy, approvedById, approvedAt, startDate, monthlyAmount, notes)
         VALUES (?, ?, ?, 'active', 'staff', ?, NOW(), NOW(), 4000, 'Non-production browser-test sponsorship')`,
        [tenantId, sponsorId, childId, staffUserId],
      );
      sponsorshipId = result.insertId;
    } else {
      await connection.execute(
        "UPDATE sponsorships SET status = 'active', approvedById = ?, approvedAt = NOW(), monthlyAmount = 4000 WHERE id = ?",
        [staffUserId, sponsorshipId],
      );
    }

    await connection.execute(
      "DELETE FROM child_updates WHERE tenantId = ? AND title = 'E2E learning update'",
      [tenantId],
    );
    await connection.execute(
      `INSERT INTO child_updates (tenantId, childId, sponsorshipId, postedById, title, content, updateType, isPublished, publishedAt)
       VALUES (?, ?, ?, ?, 'E2E learning update', 'This safe, non-production update confirms the sponsor portal update feed.', 'education', true, NOW())`,
      [tenantId, childId, sponsorshipId, staffUserId],
    );

    console.log(JSON.stringify({
      tenantId,
      accounts: { staff: STAFF_EMAIL, sponsor: SPONSOR_EMAIL, admin: ADMIN_EMAIL },
      fixture: { sponsorId, childId, sponsorshipId },
    }, null, 2));
  } finally {
    await connection.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[E2E seed]", error instanceof Error ? error.message : error);
    process.exit(1);
  });
