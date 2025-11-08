"use client";

import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Button,
  Callout,
  Dialog,
  Flex,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

/**
 * The 'subscriptionLevel' prop is the name of the subscription plan and is directly tied to the Stripe price lookup key.
 * You will need to have a price in Stripe with the same lookup key as the subscriptionLevel.
 * See https://docs.stripe.com/products-prices/pricing-models for more details
 */
export function ModalDialog({
  subscriptionLevel,
  userId,
}: {
  subscriptionLevel: string;
  userId: string;
}) {
  const router = useRouter();

  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubscribe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setLoading(true);

    if (orgName === "") {
      setError("Please fill out Organization name before submitting.");
      setLoading(false);
      return;
    }

    // Call API to create a new organization and subscribe to plan
    // The user will be redirected to Stripe Checkout
    const res = await fetch("/api/subscribe", {
      method: "POST",
      body: JSON.stringify({
        userId,
        orgName,
        subscriptionLevel: subscriptionLevel.toLowerCase(),
      }),
    });

    const { error: responseError, url } = await res.json();

    if (!responseError) {
      return router.push(url);
    }

    setLoading(false);
    setError(`Error subscribing to plan: ${responseError}`);
  };

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger>
        <Button onClick={() => setError("")}>
          Subscribe to {subscriptionLevel}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Subscribe to {subscriptionLevel}</Dialog.Title>
        <Dialog.Description mb="4" size="2">
          Enter details about your business
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Flex direction="column" gap="1">
            <Text as="div" mb="1" size="2" weight="bold">
              Organization name
            </Text>
            <TextField.Root
              onBlur={(e) => setOrgName(e.target.value)}
              placeholder="Enter your orgnization name"
            />
          </Flex>
          {error && (
            <Callout.Root color="red">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
        </Flex>

        <Flex gap="3" justify="end" mt="4">
          <Dialog.Close>
            <Button color="gray" variant="soft">
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button loading={loading} onClick={handleSubscribe}>
              Subscribe
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
