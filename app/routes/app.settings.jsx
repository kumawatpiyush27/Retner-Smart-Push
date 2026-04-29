import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  TextField,
  Button,
  Box,
  InlineStack,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopHandle = session.shop.split('.')[0];

  const store = await prisma.stores.findUnique({
    where: { store_id: shopHandle },
  });

  return json({ store: store || {} });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopHandle = session.shop.split('.')[0];
  const formData = await request.formData();
  
  const logoUrl = formData.get("logoUrl");

  await prisma.stores.update({
    where: { store_id: shopHandle },
    data: { logo_url: logoUrl },
  });

  return json({ success: true });
};

export default function SettingsPage() {
  const { store } = useLoaderData();
  const [logoUrl, setLogoUrl] = useState(store.logo_url || "");
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const handleSave = () => {
    submit({ logoUrl }, { method: "POST" });
  };

  return (
    <Page
      title="Settings"
      backAction={{ content: 'Dashboard', url: '/app' }}
      primaryAction={{
        content: 'Save',
        onAction: handleSave,
        loading: isSaving,
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">General Settings</Text>
              <TextField
                label="Store Logo URL"
                value={logoUrl}
                onChange={setLogoUrl}
                autoComplete="off"
                helpText="This logo will appear in your push notifications."
              />
            </BlockStack>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Account Information</Text>
              <InlineStack align="space-between">
                <Text tone="subdued">Store ID</Text>
                <Text fontWeight="bold">{store.store_id}</Text>
              </InlineStack>
              <Divider />
              <InlineStack align="space-between">
                <Text tone="subdued">Status</Text>
                <Text fontWeight="bold">{store.is_onboarded ? 'Active' : 'Pending'}</Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

import { useState } from "react";
