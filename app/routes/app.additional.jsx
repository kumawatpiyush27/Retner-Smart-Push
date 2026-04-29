import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Badge,
  Button,
  Banner,
  Divider,
  Icon,
} from "@shopify/polaris";
import {
  NotificationIcon,
  CartIcon,
  CheckIcon,
  ChevronRightIcon
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopHandle = session.shop.split('.')[0];

  try {
    const res = await fetch(`https://push-retner.vercel.app/my-store/automations?storeId=${shopHandle}`);
    const data = await res.json();
    return json({ shopHandle, automations: data.automations || {} });
  } catch (err) {
    return json({ shopHandle, automations: {}, error: "Failed to load automations" });
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopHandle = session.shop.split('.')[0];
  const formData = await request.formData();
  
  const type = formData.get("type"); // 'welcome' or 'abandoned'
  const enabled = formData.get("enabled") === "true";

  // Note: We need to fetch current settings first to not overwrite title/body with nulls
  // For simplicity in this demo, we'll just send the toggle. 
  // In a real app, you'd fetch current values from DB in the action too.
  
  try {
    // Fetch current to preserve content
    const currentRes = await fetch(`https://push-retner.vercel.app/my-store/automations?storeId=${shopHandle}`);
    const current = await currentRes.json();
    const settings = current.automations || {};

    const payload = {
        storeId: shopHandle,
        welcomeEnabled: type === 'welcome' ? enabled : settings.welcome_enabled,
        welcomeTitle: settings.welcome_title,
        welcomeBody: settings.welcome_body,
        abandonedEnabled: type === 'abandoned' ? enabled : settings.abandoned_enabled,
        abandonedTitle: settings.abandoned_title,
        abandonedBody: settings.abandoned_body,
        abandonedConfig: settings.abandoned_config
    };

    await fetch(`https://push-retner.vercel.app/my-store/update-automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return json({ success: true });
  } catch (e) {
    return json({ success: false, error: e.message });
  }
};

export default function AutomationsPage() {
  const { automations, shopHandle } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const toggleAutomation = (type, currentStatus) => {
    submit({ type, enabled: !currentStatus }, { method: "POST" });
  };

  const openDashboard = () => {
    window.open(`https://push-retner.vercel.app/store-admin?shop=${shopHandle}`, '_blank');
  };

  return (
    <Page
      title="Automations"
      backAction={{ content: 'Dashboard', url: '/app' }}
    >
      <Layout>
        <Layout.Section>
          <Banner tone="info">
            <p>Automations run 24/7 to recover abandoned carts and welcome new subscribers without you lifting a finger.</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="400" blockAlign="center">
                  <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                    <Icon source={NotificationIcon} tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="headingMd">Welcome Notification</Text>
                    <Text tone="subdued">Sent immediately when someone subscribes.</Text>
                  </BlockStack>
                </InlineStack>
                <InlineStack gap="300">
                  <Badge tone={automations.welcome_enabled ? "success" : "attention"}>
                    {automations.welcome_enabled ? "Active" : "Inactive"}
                  </Badge>
                  <Button 
                    variant={automations.welcome_enabled ? "secondary" : "primary"}
                    onClick={() => toggleAutomation('welcome', automations.welcome_enabled)}
                    loading={isSaving}
                  >
                    {automations.welcome_enabled ? "Deactivate" : "Activate"}
                  </Button>
                </InlineStack>
              </InlineStack>
              
              <Divider />
              
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="200">
                  <Text fontWeight="bold">Current Content:</Text>
                  <Text variant="bodySm">Title: {automations.welcome_title || "Welcome!"}</Text>
                  <Text variant="bodySm">Message: {automations.welcome_body || "Thanks for subscribing."}</Text>
                  <Box paddingBlockStart="200">
                    <Button variant="plain" onClick={openDashboard} icon={ChevronRightIcon}>Edit Content in Dashboard</Button>
                  </Box>
                </BlockStack>
              </Box>

              <InlineStack align="space-between">
                <Text tone="subdued">Performance: <b>{automations.welcome_sent_count || 0}</b> Sent | <b>{automations.welcome_click_count || 0}</b> Clicks</Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="400" blockAlign="center">
                  <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                    <Icon source={CartIcon} tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="headingMd">Abandoned Cart Recovery</Text>
                    <Text tone="subdued">Sent automatically to users who leave checkout.</Text>
                  </BlockStack>
                </InlineStack>
                <InlineStack gap="300">
                  <Badge tone={automations.abandoned_enabled ? "success" : "attention"}>
                    {automations.abandoned_enabled ? "Active" : "Inactive"}
                  </Badge>
                  <Button 
                    variant={automations.abandoned_enabled ? "secondary" : "primary"}
                    onClick={() => toggleAutomation('abandoned', automations.abandoned_enabled)}
                    loading={isSaving}
                  >
                    {automations.abandoned_enabled ? "Deactivate" : "Activate"}
                  </Button>
                </InlineStack>
              </InlineStack>
              
              <Divider />

              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="200">
                   <InlineStack gap="200"><Icon source={CheckIcon} tone="success" /><Text variant="bodySm">3-Step reminder sequence configured.</Text></InlineStack>
                   <Text variant="bodySm" tone="subdued">Reminders are sent at 20m, 10h, and 24h intervals.</Text>
                   <Box paddingBlockStart="200">
                    <Button variant="plain" onClick={openDashboard} icon={ChevronRightIcon}>Edit Sequence & Content</Button>
                  </Box>
                </BlockStack>
              </Box>

              <InlineStack align="space-between">
                <Text tone="subdued">Performance: <b>{automations.abandoned_sent_count || 0}</b> Sent | <b>{automations.abandoned_click_count || 0}</b> Clicks</Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
