import { useState } from "react";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { TitleBar } from "@shopify/app-bridge-react";
import jwt from "jsonwebtoken";
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
  InlineGrid,
  Badge,
} from "@shopify/polaris";
import {
  StarIcon,
  StoreIcon,
  PaintBrushFlatIcon,
  NotificationIcon,
  CheckIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  CashRupeeIcon,
  ChartLineIcon,
  ChartHistogramGrowthIcon,
  CartAbandonedIcon,
  MoneyIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shopHandle = session.shop.split('.')[0];

  const response = await admin.graphql(`{ shop { name } }`);
  const { data: { shop } } = await response.json();

  const extensionId = "60ed62d3-7390-2d9e-7c48-018af9320f7fbc0cd624";
  let isOnboarded = false;
  let savedLogo = "";
  let stats = { subscribers: 0, campaigns: 0, recentCampaigns: [], totalRevenue: 0, totalImpressions: 0, totalClicks: 0 };

  try {
    await prisma.$executeRaw`ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE`;
    await prisma.$executeRaw`ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url TEXT`;

    const result = await prisma.$queryRaw`SELECT is_onboarded, logo_url FROM stores WHERE store_id = ${shopHandle}`;
    if (result && result.length > 0) {
      isOnboarded = result[0].is_onboarded === true;
      savedLogo = result[0].logo_url || "";
    }

    if (isOnboarded) {
      try {
        const statsRes = await fetch(`https://push-retner.vercel.app/my-store/stats?storeId=${shopHandle}`);
        const statsData = await statsRes.json();
        if (statsData) stats = statsData;
      } catch (err) { console.log("Stats fetch error:", err); }
    }
  } catch (e) { console.log("DB/Stats Error", e); }

  const secret = 'retner_sso_final_2025';
  const token = jwt.sign({ shop: session.shop, timestamp: Date.now(), role: 'admin' }, secret, { expiresIn: "60m" });
  const ssoUrl = `https://push-retner.vercel.app/store-admin?sso_token=${token}&shop=${session.shop}`;

  return { shopName: shop.name, shopDomain: session.shop, extensionId, isOnboarded, savedLogo, stats, ssoUrl, shopHandle };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopHandle = session.shop.split('.')[0];
  const formData = await request.formData();

  if (formData.get("actionType") === "complete_setup") {
    const logoUrl = formData.get("logoUrl");
    try {
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
  const { shopName, shopDomain, extensionId, isOnboarded, savedLogo, stats, ssoUrl, shopHandle } = useLoaderData();
  const [currentStep, setCurrentStep] = useState(0);
  const [logoUrl, setLogoUrl] = useState(savedLogo || "");
  const submit = useSubmit();

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const completeSetup = () => submit({ actionType: "complete_setup", logoUrl }, { method: "POST" });
  const openThemeEditor = () => window.open(`https://${shopDomain}/admin/themes/current/editor?context=apps&activateAppId=${extensionId}`, "_blank");

  const openDashboard = () => {
    if (ssoUrl) window.open(ssoUrl, '_blank');
    else window.open('https://push-retner.vercel.app/store-admin', '_blank');
  };

  const openAutomations = () => window.location.href = '/app/additional';
  const openSettings = () => window.location.href = '/app/settings';

  if (isOnboarded) {
    const ctr = stats.totalImpressions > 0
      ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2)
      : '0.00';

    // Simulated growth sparkline data (last 7 days approximation)
    const sparkMax = Math.max(stats.subscribers, 1);

    return (
      <Page>
        <TitleBar title="Dashboard">
          <button variant="primary" onClick={openDashboard}>Go to Full Dashboard ↗</button>
        </TitleBar>

        <BlockStack gap="600">
          {/* ── KPI CARDS ── */}
          <Layout>
            <Layout.Section>
              <Text variant="headingLg">Overview</Text>
              <Box paddingBlockStart="400">
                <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
                  <Card>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text tone="subdued" variant="bodyMd">Total Subscribers</Text>
                        <Icon source={StoreIcon} tone="base" />
                      </InlineStack>
                      <Text variant="heading2xl">{stats.subscribers || 0}</Text>
                      <Text tone="success" variant="bodySm">↑ Growing</Text>
                    </BlockStack>
                  </Card>
                  <Card>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text tone="subdued" variant="bodyMd">Revenue Attributed</Text>
                        <Icon source={CashRupeeIcon} tone="success" />
                      </InlineStack>
                      <Text variant="heading2xl">₹{parseFloat(stats.totalRevenue || 0).toFixed(0)}</Text>
                      <Text tone="subdued" variant="bodySm">From push campaigns</Text>
                    </BlockStack>
                  </Card>
                  <Card>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text tone="subdued" variant="bodyMd">Total Impressions</Text>
                        <Icon source={ChartHistogramGrowthIcon} tone="base" />
                      </InlineStack>
                      <Text variant="heading2xl">{stats.totalImpressions || 0}</Text>
                      <Text tone="subdued" variant="bodySm">Notifications delivered</Text>
                    </BlockStack>
                  </Card>
                  <Card>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text tone="subdued" variant="bodyMd">Avg. CTR</Text>
                        <Icon source={ChartLineIcon} tone="base" />
                      </InlineStack>
                      <Text variant="heading2xl">{ctr}%</Text>
                      <Text tone="subdued" variant="bodySm">Click-through rate</Text>
                    </BlockStack>
                  </Card>
                </InlineGrid>
              </Box>
            </Layout.Section>
          </Layout>

          {/* ── CAMPAIGNS + QUICK ACTIONS ── */}
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text variant="headingMd">Recent Campaigns</Text>
                    <Button variant="plain" onClick={openDashboard}>View All →</Button>
                  </InlineStack>
                  <Divider />
                  {stats.recentCampaigns && stats.recentCampaigns.length > 0 ? (
                    <BlockStack gap="300">
                      {stats.recentCampaigns.map(c => (
                        <div key={c.id}>
                          <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="300" blockAlign="center">
                              <div style={{ width: 36, height: 36, background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon source={NotificationIcon} tone="base" />
                              </div>
                              <BlockStack gap="050">
                                <Text fontWeight="bold" variant="bodySm">{c.title}</Text>
                                <Text tone="subdued" variant="bodySm">{new Date(c.created_at).toLocaleDateString('en-IN')} · {c.sent_count || 0} sent</Text>
                              </BlockStack>
                            </InlineStack>
                            <InlineStack gap="200">
                              {c.revenue > 0 && (
                                <Badge tone="success">₹{parseFloat(c.revenue).toFixed(0)}</Badge>
                              )}
                              <div style={{ padding: '4px 10px', background: '#DCFCE7', borderRadius: 6, color: '#166534', fontSize: 12, fontWeight: 'bold' }}>
                                {c.status === 'scheduled' ? '⏳ Scheduled' : '✓ Sent'}
                              </div>
                            </InlineStack>
                          </InlineStack>
                        </div>
                      ))}
                    </BlockStack>
                  ) : (
                    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                      <BlockStack gap="200">
                        <Text tone="subdued" alignment="center">No campaigns sent yet.</Text>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <Button onClick={openDashboard}>Create Your First Campaign</Button>
                        </div>
                      </BlockStack>
                    </Box>
                  )}
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              <BlockStack gap="400">
                {/* Quick Actions */}
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd">Quick Actions</Text>
                    <Divider />
                    <Button fullWidth onClick={openDashboard} icon={NotificationIcon}>Send Campaign Now</Button>
                    <Button fullWidth onClick={openAutomations} icon={CartAbandonedIcon}>Manage Automations</Button>
                    <Button fullWidth onClick={openThemeEditor} icon={PaintBrushFlatIcon}>Open Theme Editor</Button>
                  </BlockStack>
                </Card>

                {/* Automation Status */}
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd">Automation Health</Text>
                    <Divider />
                    <InlineStack align="space-between">
                      <InlineStack gap="200">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginTop: 4 }} />
                        <Text variant="bodySm">Welcome Notification</Text>
                      </InlineStack>
                      <Badge tone="success">Active</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <InlineStack gap="200">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginTop: 4 }} />
                        <Text variant="bodySm">Cart Recovery (3-step)</Text>
                      </InlineStack>
                      <Badge tone="success">Active</Badge>
                    </InlineStack>
                    <Button variant="plain" onClick={openAutomations}>Configure →</Button>
                  </BlockStack>
                </Card>

                {/* Revenue Tip */}
                <Card>
                  <BlockStack gap="200">
                    <InlineStack gap="200">
                      <Icon source={MoneyIcon} tone="success" />
                      <Text variant="headingSm" tone="success">Revenue Tip</Text>
                    </InlineStack>
                    <Text tone="subdued" variant="bodySm">
                      Stores with Flash Sale campaigns see <b>3x more revenue</b> per notification than regular campaigns.
                    </Text>
                    <Button variant="plain" onClick={openDashboard}>Try Flash Sale →</Button>
                  </BlockStack>
                </Card>
                {/* Review Collector */}
                <Card background="bg-surface-info-subdued">
                  <BlockStack gap="200">
                    <InlineStack gap="200">
                      <Icon source={StarIcon} tone="warning" />
                      <Text variant="headingSm">Enjoying Retner?</Text>
                    </InlineStack>
                    <Text tone="subdued" variant="bodySm">
                      Your feedback helps us improve! If you like the app, please leave us a 5-star review on the Shopify App Store.
                    </Text>
                    <Button 
                      variant="primary" 
                      fullWidth 
                      onClick={() => window.open('https://apps.shopify.com/retner-smartpush-live/reviews', '_blank')}
                    >
                      Write a Review ⭐
                    </Button>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Layout.Section>
          </Layout>

          {/* ── SUBSCRIBER GROWTH BAR ── */}
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text variant="headingMd">Subscriber Growth</Text>
                    <Badge tone="info">{stats.subscribers} Total</Badge>
                  </InlineStack>
                  <Divider />
                  <BlockStack gap="200">
                    <Text tone="subdued" variant="bodySm">Growth progress toward milestones</Text>
                    <InlineStack align="space-between">
                      <Text variant="bodySm">0</Text>
                      <Text variant="bodySm" fontWeight="bold">{stats.subscribers} subscribers</Text>
                      <Text variant="bodySm">1,000</Text>
                    </InlineStack>
                    <ProgressBar progress={Math.min((stats.subscribers / 1000) * 100, 100)} size="large" tone="primary" />
                    <InlineGrid columns={3} gap="200">
                      <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                        <BlockStack gap="050">
                          <Text variant="bodySm" fontWeight="bold">100</Text>
                          <Text variant="bodySm" tone="subdued">Starter</Text>
                        </BlockStack>
                      </Box>
                      <Box padding="200" background={stats.subscribers >= 500 ? "bg-surface-success" : "bg-surface-secondary"} borderRadius="100">
                        <BlockStack gap="050">
                          <Text variant="bodySm" fontWeight="bold">500</Text>
                          <Text variant="bodySm" tone="subdued">Growth</Text>
                        </BlockStack>
                      </Box>
                      <Box padding="200" background={stats.subscribers >= 1000 ? "bg-surface-success" : "bg-surface-secondary"} borderRadius="100">
                        <BlockStack gap="050">
                          <Text variant="bodySm" fontWeight="bold">1,000</Text>
                          <Text variant="bodySm" tone="subdued">Pro</Text>
                        </BlockStack>
                      </Box>
                    </InlineGrid>
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>

          {/* ── TIPS BANNER ── */}
          <Banner tone="info">
            <p>
              <b>Pro Tip:</b> Enable <b>Abandoned Cart Recovery</b> to automatically recover lost sales. Stores using it recover an average of 15% of abandoned checkouts.
              {" "}<Button variant="plain" onClick={openAutomations}>Enable Now →</Button>
            </p>
          </Banner>
        </BlockStack>
      </Page>
    );
  }

  // ── ONBOARDING WIZARD ──
  const steps = [
    { title: "Welcome", icon: StarIcon },
    { title: "App Embed", icon: StoreIcon },
    { title: "Branding", icon: PaintBrushFlatIcon },
    { title: "Opt-In Popup", icon: NotificationIcon },
    { title: "Complete", icon: CheckIcon },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BlockStack gap="800" align="center">
            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <div style={{ color: 'white', transform: 'scale(2)' }}><Icon source={StarIcon} /></div>
            </div>
            <BlockStack gap="200" align="center">
              <Text as="h1" variant="headingXl">Welcome to Retner SmartPush! 🎉</Text>
              <Box maxWidth="600px"><Text variant="bodyLg" tone="subdued" alignment="center">You're just a few steps away from sending powerful web push notifications to your customers.</Text></Box>
            </BlockStack>
            <Button variant="primary" size="large" onClick={handleNext} icon={ArrowRightIcon}>Let's Get Started</Button>
          </BlockStack>
        );
      case 1:
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
            <InlineStack align="space-between"><Button onClick={handleBack} icon={ChevronLeftIcon}>Back</Button><Button onClick={handleNext} variant="primary">I've Enabled It →</Button></InlineStack>
          </BlockStack>
        );
      case 2:
        return (
          <BlockStack gap="600">
            <Text as="h2" variant="headingLg">Customize Your Branding</Text>
            <Card>
              <BlockStack gap="400">
                <TextField label="Logo URL" value={logoUrl} onChange={setLogoUrl} autoComplete="off" placeholder="https://example.com/logo.png" helpText="Paste the URL of your store logo. This will appear in push notifications." />
                <TextField label="Notification Button Text" value="Allow" autoComplete="off" />
                <Text variant="bodyMd" fontWeight="bold">Primary Color</Text>
                <div style={{ display: 'flex', gap: '10px' }}>{['#000000', '#2C2088', '#E11D48', '#16A34A'].map(color => (<div key={color} style={{ width: 40, height: 40, background: color, borderRadius: '50%', cursor: 'pointer', border: '2px solid #ddd' }} />))}</div>
              </BlockStack>
            </Card>
            <InlineStack align="space-between"><Button onClick={handleBack} icon={ChevronLeftIcon}>Back</Button><Button onClick={handleNext} variant="primary">Continue →</Button></InlineStack>
          </BlockStack>
        );
      case 3:
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
      case 4:
        return (
          <BlockStack gap="800" align="center">
            <div style={{ width: '80px', height: '80px', background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#166534', transform: 'scale(2)' }}><Icon source={CheckIcon} /></div>
            </div>
            <BlockStack gap="200" align="center">
              <Text as="h1" variant="headingXl">You're All Set! 🚀</Text>
              <Text variant="bodyLg" tone="subdued">Retner SmartPush is now active on your store. Start sending campaigns from the dashboard.</Text>
            </BlockStack>
            <Button variant="primary" size="large" onClick={() => { completeSetup(); openDashboard(); }}>
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
        <Box paddingBlockEnd="400">
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd">Setup Guide</Text>
              <Text tone="subdued">Step {currentStep + 1} of 5</Text>
            </InlineStack>
            <ProgressBar progress={((currentStep + 1) / 5) * 100} size="small" tone="primary" />
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
          <Layout><Layout.Section>{renderStepContent()}</Layout.Section></Layout>
        </Box>
      </BlockStack>
    </Page>
  );
}
