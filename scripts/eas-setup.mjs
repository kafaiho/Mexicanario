/**
 * EAS setup script — generates Android keystore and triggers build
 * without needing an interactive terminal.
 */
import crypto from "crypto";

const TOKEN = process.env.EXPO_TOKEN;
const PROJECT_ID = "ea949252-b664-4472-b1a6-afcdadc99cc9";
const ACCOUNT_NAME = "kafai";

const GQL = "https://api.expo.dev/graphql";

async function gql(query, variables = {}) {
  const res = await fetch(GQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "expo-client-info": JSON.stringify({ appVersion: "14.0.0", clientEventSource: "eas-cli" }),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

// 1. Get account ID
async function getAccountId() {
  const data = await gql(`{ meActor { ... on User { accounts { id name } } } }`);
  const account = data.meActor.accounts.find((a) => a.name === ACCOUNT_NAME);
  if (!account) throw new Error(`Account "${ACCOUNT_NAME}" not found`);
  console.log(`✓ Account ID: ${account.id}`);
  return account.id;
}

// 2. Get keystore generation URL
async function getKeystoreGenUrl() {
  const data = await gql(`
    mutation CreateKeystoreGenerationUrlMutation {
      keystoreGenerationUrl {
        createKeystoreGenerationUrl { id url }
      }
    }
  `);
  return data.keystoreGenerationUrl.createKeystoreGenerationUrl.url;
}

// 3. Generate keystore in cloud
async function generateKeystore(url) {
  const params = {
    keystorePassword: crypto.randomBytes(16).toString("hex"),
    keyPassword: crypto.randomBytes(16).toString("hex"),
    keyAlias: crypto.randomBytes(16).toString("hex"),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const result = await res.json();
  console.log(`✓ Keystore generated in cloud`);
  return {
    type: "JKS",
    base64EncodedKeystore: result.keystoreBase64,
    keystorePassword: result.keystorePassword,
    keyAlias: result.keyAlias,
    keyPassword: result.keyPassword,
  };
}

// 4. Save keystore on EAS
async function createAndroidKeystore(accountId, keystoreData) {
  const data = await gql(
    `
    mutation CreateAndroidKeystoreMutation($androidKeystoreInput: AndroidKeystoreInput!, $accountId: ID!) {
      androidKeystore {
        createAndroidKeystore(androidKeystoreInput: $androidKeystoreInput, accountId: $accountId) {
          id keyAlias
        }
      }
    }
  `,
    { accountId, androidKeystoreInput: keystoreData }
  );
  const ks = data.androidKeystore.createAndroidKeystore;
  console.log(`✓ Keystore saved on EAS (ID: ${ks.id})`);
  return ks.id;
}

// 5. Get or create app build credentials
async function setupBuildCredentials(keystoreId) {
  const packageName = "com.kafaiho.mexicanario";

  // Create Android app credentials
  const created = await gql(
    `
    mutation CreateAndroidAppCredentialsMutation(
      $androidAppCredentialsInput: AndroidAppCredentialsInput!
      $appId: ID!
      $applicationIdentifier: String!
    ) {
      androidAppCredentials {
        createAndroidAppCredentials(
          androidAppCredentialsInput: $androidAppCredentialsInput
          appId: $appId
          applicationIdentifier: $applicationIdentifier
        ) {
          id applicationIdentifier
        }
      }
    }
  `,
    {
      androidAppCredentialsInput: {},
      appId: PROJECT_ID,
      applicationIdentifier: packageName,
    }
  );
  const appCredId = created.androidAppCredentials.createAndroidAppCredentials.id;
  console.log(`✓ App credentials created (ID: ${appCredId})`);

  // Link keystore to app credentials
  const buildCred = await gql(
    `
    mutation CreateAndroidAppBuildCredentialsMutation(
      $androidAppBuildCredentialsInput: AndroidAppBuildCredentialsInput!
      $androidAppCredentialsId: ID!
    ) {
      androidAppBuildCredentials {
        createAndroidAppBuildCredentials(
          androidAppBuildCredentialsInput: $androidAppBuildCredentialsInput
          androidAppCredentialsId: $androidAppCredentialsId
        ) {
          id isDefault
        }
      }
    }
  `,
    {
      androidAppBuildCredentialsInput: { keystoreId, isDefault: true, name: "default" },
      androidAppCredentialsId: appCredId,
    }
  );
  console.log(`✓ Keystore linked to app credentials`);
  return buildCred.androidAppBuildCredentials.createAndroidAppBuildCredentials.id;
}

// 6. Trigger build
async function triggerBuild() {
  const data = await gql(
    `
    mutation CreateBuild($projectId: String!, $buildInput: BuildParamsInput!) {
      build {
        createAndroidBuild(projectId: $projectId, buildInput: $buildInput) {
          id status __typename
        }
      }
    }
  `,
    {
      projectId: PROJECT_ID,
      buildInput: {
        buildProfile: "preview",
        platform: "ANDROID",
      },
    }
  );
  return data;
}

async function main() {
  console.log("🚀 Starting EAS build setup...\n");

  const accountId = await getAccountId();

  console.log("\n📦 Generating Android Keystore...");
  const genUrl = await getKeystoreGenUrl();
  const keystoreData = await generateKeystore(genUrl);
  const keystoreId = await createAndroidKeystore(accountId, keystoreData);

  console.log("\n🔗 Setting up build credentials...");
  await setupBuildCredentials(keystoreId);

  console.log("\n✅ Credentials ready! Now run:\n");
  console.log("   npx eas build --platform android --profile preview --non-interactive\n");
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
