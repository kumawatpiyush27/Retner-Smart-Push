import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import {
  StarIcon,
  StoreIcon,
  PaintBrushFlatIcon,
  NotificationIcon,
  CheckIcon,
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  // Fetch Shop Name
  const response = await admin.graphql(`{ shop { name } }`);
  const { data: { shop } } = await response.json();

  // Extension ID for "push-notification-popup"
  // Confirmed from Screenshot Step 1233: 60ed62d3-7390-2d9e-7c48-018af9320f7fbc0cd624
  const extensionId = "60ed62d3-7390-2d9e-7c48-018af9320f7fbc0cd624";

  return { shopName: shop.name, shopDomain: session.shop, extensionId };
};

export default function Index() {
  const { shopName, shopDomain, extensionId } = useLoaderData();
  const shopify = useAppBridge();

  const openThemeEditor = () => {
    // Deep Link to Shopify Theme Editor with App Embed Activated
    // Format: https://{shop}/admin/themes/current/editor?context=apps&activateAppId={extensionId}
    // Using admin.shopify.com format for slightly faster redirection if strictly in admin, 
    // but session.shop/admin is safer for all stores.
    // However, App Bridge host provides context. 
    // Let's use window.open with the standard URL structure.

    // Note: 'popup' might be the block handle if using app blocks. 
    // For App Embeds, it is usually just the UUID.
    // If the screenshot showed Handle: 'push-notification-popup' and UID: '60ed...', 
    // activating the UUID is correct.

    const url = `https://${shopDomain}/admin/themes/current/editor?context=apps&activateAppId=${extensionId}`;
    window.open(url, "_blank");
  };

  return (
    <Page fullWidth>
      <BlockStack gap="800">

        {/* TOP STEPPER (Simulated with InlineStack) */}
        <Box paddingBlockStart="800" paddingBlockEnd="400">
          <BlockStack gap="500" align="center">

            {/* Steps Visual */}
            <InlineStack gap="600" align="center" blockAlign="center">

              {/* Step 1: Welcome (Active) */}
              <BlockStack gap="200" align="center">
                <div style={{
                  width: '40px', height: '40px',
                  background: '#2C2088',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                  <Icon source={StarIcon} tone="base" />
                </div>
                <Text variant="bodySm" fontWeight="bold">Welcome</Text>
              </BlockStack>

              <div style={{ width: '60px', height: '2px', background: '#E3E3E3' }} />

              {/* Step 2: App Embed */}
              <BlockStack gap="200" align="center">
                <div style={{
                  width: '40px', height: '40px',
                  background: '#F1F1F1',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'
                }}>
                  <Icon source={StoreIcon} />
                </div>
                <Text variant="bodySm" tone="subdued">App Embed</Text>
              </BlockStack>

              <div style={{ width: '60px', height: '2px', background: '#E3E3E3' }} />

              {/* Step 3: Branding */}
              <BlockStack gap="200" align="center">
                <div style={{
                  width: '40px', height: '40px',
                  background: '#F1F1F1',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'
                }}>
                  <Icon source={PaintBrushFlatIcon} />
                </div>
                <Text variant="bodySm" tone="subdued">Branding</Text>
              </BlockStack>

              <div style={{ width: '60px', height: '2px', background: '#E3E3E3' }} />

              {/* Step 4: Opt-in */}
              <BlockStack gap="200" align="center">
                <div style={{
                  width: '40px', height: '40px',
                  background: '#F1F1F1',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'
                }}>
                  <Icon source={NotificationIcon} />
                </div>
                <Text variant="bodySm" tone="subdued">Opt-in Popup</Text>
              </BlockStack>

              <div style={{ width: '60px', height: '2px', background: '#E3E3E3' }} />

              {/* Step 5: Complete */}
              <BlockStack gap="200" align="center">
                <div style={{
                  width: '40px', height: '40px',
                  background: '#F1F1F1',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'
                }}>
                  <Icon source={CheckIcon} />
                </div>
                <Text variant="bodySm" tone="subdued">Complete</Text>
              </BlockStack>

            </InlineStack>
          </BlockStack>
        </Box>

        {/* MAIN CARD CONTENT */}
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="1000" paddingBlockStart="1200" paddingBlockEnd="1200">
                <BlockStack gap="800" align="center">

                  {/* Hero Icon */}
                  <div style={{
                    width: '80px', height: '80px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ color: 'white', transform: 'scale(2)' }}>
                      <Icon source={StarIcon} />
                    </div>
                  </div>

                  {/* Headings */}
                  <BlockStack gap="200" align="center">
                    <Text as="h1" variant="headingXl">Welcome to {shopName}! 🎉</Text>
                    <Box maxWidth="600px">
                      <Text variant="bodyLg" tone="subdued" alignment="center">
                        You're just a few steps away from sending powerful web push notifications to your
                        customers. Let's set up your account and get you ready to engage your audience.
                      </Text>
                    </Box>
                  </BlockStack>

                  {/* Action Cards Row */}
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '20px' }}>

                    {/* Card 1 */}
                    <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '24px', width: '220px', textAlign: 'center', border: '1px solid #E4E4E5' }}>
                      <BlockStack gap="400" align="center">
                        <div style={{ color: '#4F46E5' }}><Icon source={StoreIcon} tone="base" /></div>
                        <BlockStack gap="100">
                          <Text variant="headingSm">Enable App Embed</Text>
                          <Text variant="bodyXs" tone="subdued">Activate the app in your Shopify theme</Text>
                        </BlockStack>
                      </BlockStack>
                    </div>

                    {/* Card 2 */}
                    <div style={{ background: '#FFF7ED', borderRadius: '12px', padding: '24px', width: '220px', textAlign: 'center', border: '1px solid #FFEDD5' }}>
                      <BlockStack gap="400" align="center">
                        <div style={{ color: '#EA580C' }}><Icon source={PaintBrushFlatIcon} tone="base" /></div>
                        <BlockStack gap="100">
                          <Text variant="headingSm">Set Your Branding</Text>
                          <Text variant="bodyXs" tone="subdued">Upload your logo and choose colors</Text>
                        </BlockStack>
                      </BlockStack>
                    </div>

                    {/* Card 3 */}
                    <div style={{ background: '#FDF2F8', borderRadius: '12px', padding: '24px', width: '220px', textAlign: 'center', border: '1px solid #FCE7F3' }}>
                      <BlockStack gap="400" align="center">
                        <div style={{ color: '#DB2777' }}><Icon source={NotificationIcon} tone="base" /></div>
                        <BlockStack gap="100">
                          <Text variant="headingSm">Design Opt-in</Text>
                          <Text variant="bodyXs" tone="subdued">Customize your permission prompt</Text>
                        </BlockStack>
                      </BlockStack>
                    </div>

                  </div>

                  {/* Status & CTA */}
                  <BlockStack gap="400" align="center">
                    <Text variant="bodySm" tone="success">
                      <InlineStack align="center" gap="100">
                        <Icon source={CheckIcon} tone="success" />
                        <span>Takes about 3-5 minutes to complete</span>
                      </InlineStack>
                    </Text>

                    <Button variant="primary" size="large" onClick={openThemeEditor}>
                      Get Started →
                    </Button>
                  </BlockStack>

                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
