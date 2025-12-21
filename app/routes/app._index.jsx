import { useState } from "react";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
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
  ProgressBar,
  TextField,
  Divider,
  Banner,
} from "@shopify/polaris";
import {
  StarIcon,
  StoreIcon,
  PaintBrushFlatIcon,
  NotificationIcon,
  CheckIcon,
  ArrowRightIcon,
  ChevronLeftIcon
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shopHandle = session.shop.split('.')[0];

  // Fetch Shop Name
  const response = await admin.graphql(`{ shop { name } }`);
  const { data: { shop } } = await response.json();

  // Extension ID
  const extensionId = "60ed62d3-7390-2d9e-7c48-018af9320f7fbc0cd624";

  let isOnboarded = false;
  let savedLogo = "";
  try {
    // Create column if missing (Migration on the fly)
    await prisma.$executeRaw`
        ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE
      `;
    await prisma.$executeRaw`
        ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url TEXT
      `;

    const result = await prisma.$queryRaw`SELECT is_onboarded, logo_url FROM stores WHERE store_id = ${shopHandle}`;
    if (result && result.length > 0) {
      isOnboarded = result[0].is_onboarded === true;
      savedLogo = result[0].logo_url || "";
    }
  } catch (e) {
    console.log("DB Check Error", e);
  }

  return { shopName: shop.name, shopDomain: session.shop, extensionId, isOnboarded, savedLogo };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopHandle = session.shop.split('.')[0];
  const formData = await request.formData();

  if (formData.get("actionType") === "complete_setup") {
    const logoUrl = formData.get("logoUrl");
    try {
      // Upsert: Create if not exists, Update if exists
      await prisma.$executeRaw`
                INSERT INTO stores (store_id, store_name, is_onboarded, logo_url)
                VALUES (${shopHandle}, ${shopHandle}, true, ${logoUrl})
                ON CONFLICT (store_id) DO UPDATE SET is_onboarded = true, logo_url = ${logoUrl}
             `;
    } catch (e) {
      console.error("Failed to update onboarding", e);
    }
    return json({ success: true });
  }
  return null;
};

export default function Index() {
  const { shopName, shopDomain, extensionId, isOnboarded, savedLogo } = useLoaderData();
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 for new users
  const [logoUrl, setLogoUrl] = useState(savedLogo || "");
  const submit = useSubmit();

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const completeSetup = () => {
    // Fire action to save state
    submit({ actionType: "complete_setup", logoUrl }, { method: "POST" });
  };

  const openThemeEditor = () => {
    const url = `https://${shopDomain}/admin/themes/current/editor?context=apps&activateAppId=${extensionId}`;
    window.open(url, "_blank");
  };

  const dashboardButton = (
    <Button variant="primary" size="large" onClick={async () => {
      const res = await fetch("/api/sso");
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    }}>
      Go to Dashboard ↗
    </Button>
  );

  // If already onboarded, show Dashboard Home directly
  if (isOnboarded) {
    return (
      <Page>
        <BlockStack gap="800" align="center">
          <Box paddingBlockStart="800" paddingBlockEnd="800">
            <BlockStack gap="600" align="center">
              <div style={{
                width: '100px', height: '100px',
                background: '#F1F5F9',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ transform: 'scale(2.5)' }}><Icon source={StoreIcon} tone="base" /></div>
              </div>
              <Text as="h1" variant="headingXl">Welcome Back, {shopName}!</Text>
              <Text variant="bodyLg" tone="subdued">Your push notifications are active.</Text>
              {dashboardButton}
            </BlockStack>
          </Box>
        </BlockStack>
      </Page>
    );
  }

  // .. rest of wizard code
  const steps = [
    { title: "Welcome", icon: StarIcon },
    { title: "App Embed", icon: StoreIcon },
    { title: "Branding", icon: PaintBrushFlatIcon },
    { title: "Opt-In Popup", icon: NotificationIcon },
    { title: "Complete", icon: CheckIcon },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      // ... Cases 0-3 same as before ...
      case 0: // Welcome
        return (
          <BlockStack gap="800" align="center">
            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <div style={{ color: 'white', transform: 'scale(2)' }}><Icon source={StarIcon} /></div>
            </div>
            <BlockStack gap="200" align="center">
              <Text as="h1" variant="headingXl">Welcome to {shopName}! 🎉</Text>
              <Box maxWidth="600px"><Text variant="bodyLg" tone="subdued" alignment="center">You're just a few steps away from sending powerful web push notifications.</Text></Box>
            </BlockStack>
            <Button variant="primary" size="large" onClick={handleNext} icon={ArrowRightIcon}>Let's Get Started</Button>
          </BlockStack>
        );
      case 1: // App Embed
        return (
          <BlockStack gap="600">
            <BlockStack gap="200"><Text as="h2" variant="headingLg">Enable App Embed</Text><Text as="p" tone="subdued">To collect subscribers, you need to enable the App Embed in your Shopify Theme.</Text></BlockStack>
            <Banner tone="info"><p>Clicking the button below will open your Theme Editor and automatically locate the App Embed.</p></Banner>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="start" gap="400" blockAlign="center">
                  <div style={{ padding: '10px', background: '#F1F1F1', borderRadius: '8px' }}><Icon source={StoreIcon} tone="base" /></div>
                  <BlockStack gap="100"><Text variant="headingSm">Step 1: Open Theme Editor</Text><Text variant="bodySm" tone="subdued">Enable the toggle and click 'Save'.</Text></BlockStack>
                </InlineStack>
                <Button onClick={openThemeEditor}>Open Theme Editor ↗</Button>
              </BlockStack>
            </Card>
            <InlineStack align="end"><Button onClick={handleNext} variant="primary">I've Enabled It →</Button></InlineStack>
          </BlockStack>
        );
      case 2: // Branding
        return (
          <BlockStack gap="600">
            <Text as="h2" variant="headingLg">Customize Your Branding</Text>
            <Card>
              <BlockStack gap="400">
                <TextField label="Logo URL" value={logoUrl} onChange={setLogoUrl} autoComplete="off" placeholder="https://example.com/logo.png" helpText="Paste the URL of your store logo." />
                <TextField label="Button Text" value="Allow" autoComplete="off" />
                <Text variant="bodyMd" fontWeight="bold">Primary Color</Text>
                <div style={{ display: 'flex', gap: '10px' }}>{['#000000', '#2C2088', '#E11D48', '#16A34A'].map(color => (<div key={color} style={{ width: 40, height: 40, background: color, borderRadius: '50%', cursor: 'pointer', border: '2px solid #ddd' }} />))}</div>
              </BlockStack>
            </Card>
            <InlineStack align="space-between"><Button onClick={handleBack} icon={ChevronLeftIcon}>Back</Button><Button onClick={handleNext} variant="primary">Continue →</Button></InlineStack>
          </BlockStack>
        );
      case 3: // Opt-in
        return (
          <BlockStack gap="600">
            <Text as="h2" variant="headingLg">Opt-In Settings</Text>
            <Card>
              <BlockStack gap="400">
                <Banner title="Preview Mode"><p>This is how the popup will appear to your visitors.</p></Banner>
                <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                  <InlineStack align="center"><div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '300px' }}><BlockStack gap="300"><Text variant="headingSm">Get updates on new products?</Text><InlineStack gap="200"><Button size="slim">Later</Button><Button variant="primary" size="slim">Allow</Button></InlineStack></BlockStack></div></InlineStack>
                </Box>
              </BlockStack>
            </Card>
            <InlineStack align="space-between"><Button onClick={handleBack} icon={ChevronLeftIcon}>Back</Button><Button onClick={handleNext} variant="primary">Activate & Finish →</Button></InlineStack>
          </BlockStack>
        );

      case 4: // Complete
        return (
          <BlockStack gap="800" align="center">
            <div style={{ width: '80px', height: '80px', background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#166534', transform: 'scale(2)' }}><Icon source={CheckIcon} /></div>
            </div>
            <BlockStack gap="200" align="center">
              <Text as="h1" variant="headingXl">You're All Set!</Text>
              <Text variant="bodyLg" tone="subdued">Retner SmartPush is now active on your store.</Text>
            </BlockStack>

            {/* Call completeSetup on first click to save state, then dashboard */}
            <Button variant="primary" size="large" onClick={() => {
              completeSetup();
              // Then open dashboard
              (async () => {
                const res = await fetch("/api/sso");
                const data = await res.json();
                if (data.url) window.open(data.url, "_blank");
              })();
            }}>
              Go to Dashboard ↗
            </Button>
          </BlockStack>
        );

      default: return null;
    }
  };

  return (
    <Page>
      <BlockStack gap="500">

        {/* Header with Progress */}
        <Box paddingBlockEnd="400">
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd">Setup Guide</Text>
              <Text tone="subdued">Step {currentStep + 1} of 5</Text>
            </InlineStack>
            <ProgressBar progress={((currentStep + 1) / 5) * 100} size="small" tone="primary" />

            {/* Stepper Visuals */}
            <div style={{ marginTop: '20px', overflowX: 'auto' }}>
              <InlineStack gap="400" wrap={false} align="center">
                {steps.map((s, index) => {
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  return (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', opacity: isActive || isCompleted ? 1 : 0.5 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: isActive ? 'var(--p-action-primary)' : (isCompleted ? '#DCFCE7' : '#E3E3E3'),
                        color: isActive ? 'white' : (isCompleted ? '#166534' : '#888'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8
                      }}>
                        {isCompleted ? <Icon source={CheckIcon} tone="inherit" /> : index + 1}
                      </div>
                      <Text variant="bodySm" fontWeight={isActive ? 'bold' : 'regular'}>{s.title}</Text>
                      {index < steps.length - 1 && <div style={{ width: 40, height: 2, background: '#E3E3E3', margin: '0 10px' }} />}
                    </div>
                  )
                })}
              </InlineStack>
            </div>
          </BlockStack>
        </Box>

        <Divider />

        <Box paddingBlockStart="800">
          <Layout>
            <Layout.Section>
              {renderStepContent()}
            </Layout.Section>
          </Layout>
        </Box>

      </BlockStack>
    </Page>
  );
}
