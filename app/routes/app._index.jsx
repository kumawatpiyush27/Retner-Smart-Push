import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(`{ shop { name } }`);
  const { data: { shop } } = await response.json();
  return { shopName: shop.name };
};

export default function Index() {
  const { shopName } = useLoaderData();

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="h1" variant="headingMd">
              Debug: App is Working!
            </Text>
            <Text as="p">
              Connected to: {shopName}
            </Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};


