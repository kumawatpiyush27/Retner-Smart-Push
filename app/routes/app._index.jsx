import { useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(`{ shop { name } }`);
  const { data: { shop } } = await response.json();
  return { shopName: shop.name, shopDomain: session.shop };
};

export default function Index() {
  const { shopName, shopDomain } = useLoaderData();
  const shopify = useAppBridge();

  const openThemeEditor = () => {
    const editorUrl = `https://${shopDomain}/admin/themes/current/editor?context=apps&activateAppId=YOUR_EXTENSION_ID/popup`;
    window.open(editorUrl, "_blank");
  };

  return (
    <Page>
      <BlockStack gap="800">
        {/* STEPPER & PROGRESS */}
        <Box paddingBlockStart="400">
          <BlockStack gap="400" align="center">
            <Text variant="bodySm" as="p" color="subdued">Step 1 of 4 • 25% Complete</Text>
            <div style={{ width: '400px', height: '8px', background: '#E1E3E5', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '25%', height: '100%', background: '#008060', borderRadius: '4px' }}></div>
            </div>

            <InlineStack gap="800" align="center">
              <BlockStack gap="100" align="center">
                <div style={{ width: '40px', height: '40px', background: '#5C5F62', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🚀</div>
                <Text variant="bodyXs" fontWeight="bold">Welcome</Text>
              </BlockStack>
              <div style={{ height: '2px', width: '40px', background: '#E1E3E5', marginTop: '20px' }}></div>
              <BlockStack gap="100" align="center">
                <div style={{ width: '40px', height: '40px', background: '#F1F2F3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏪</div>
                <Text variant="bodyXs" color="subdued">App Embed</Text>
              </BlockStack>
              <div style={{ height: '2px', width: '40px', background: '#E1E3E5', marginTop: '20px' }}></div>
              <BlockStack gap="100" align="center">
                <div style={{ width: '40px', height: '40px', background: '#F1F2F3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎨</div>
                <Text variant="bodyXs" color="subdued">Branding</Text>
              </BlockStack>
              <div style={{ height: '2px', width: '40px', background: '#E1E3E5', marginTop: '20px' }}></div>
              <BlockStack gap="100" align="center">
                <div style={{ width: '40px', height: '40px', background: '#F1F2F3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</div>
                <Text variant="bodyXs" color="subdued">Complete</Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Box>

        {/* MAIN ONBOARDING CARD */}
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="600" align="center">
                  <div style={{ width: '80px', height: '80px', background: '#EDEEEF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🎉</div>

                  <BlockStack gap="200" align="center">
                    <Text as="h1" variant="headingXl">Welcome to Retner SmartPush! ✨</Text>
                    <Text variant="bodyLg" as="p" color="subdued" alignment="center">
                      You're just a few steps away from sending powerful push notifications. <br />
                      Let's get your account ready to engage your audience.
                    </Text>
                  </BlockStack>

                  <InlineStack gap="400" align="center">
                    <Box padding="600" background="bg-surface-secondary" borderRadius="400" width="220px">
                      <BlockStack gap="300" align="center">
                        <div style={{ fontSize: '24px' }}>🏪</div>
                        <Text variant="headingMd" alignment="center">Enable App Embed</Text>
                        <Text variant="bodySm" color="subdued" alignment="center">Activate the app in your Shopify theme</Text>
                      </BlockStack>
                    </Box>

                    <Box padding="600" background="bg-surface-secondary" borderRadius="400" width="220px">
                      <BlockStack gap="300" align="center">
                        <div style={{ fontSize: '24px' }}>🎨</div>
                        <Text variant="headingMd" alignment="center">Set Your Branding</Text>
                        <Text variant="bodySm" color="subdued" alignment="center">Upload your logo and choose colors</Text>
                      </BlockStack>
                    </Box>

                    <Box padding="600" background="bg-surface-secondary" borderRadius="400" width="220px">
                      <BlockStack gap="300" align="center">
                        <div style={{ fontSize: '24px' }}>🔔</div>
                        <Text variant="headingMd" alignment="center">Design Opt-in</Text>
                        <Text variant="bodySm" color="subdued" alignment="center">Customize your permission prompt</Text>
                      </BlockStack>
                    </Box>
                  </InlineStack>

                  <Box paddingBlockStart="400">
                    <Button variant="primary" size="large" onClick={openThemeEditor}>Get Started →</Button>
                  </Box>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

import { useLoaderData } from "@remix-run/react";

