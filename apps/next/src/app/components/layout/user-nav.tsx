"use client";

import { PersonIcon } from "@radix-ui/react-icons";
import {
	Avatar,
	Button,
	DropdownMenu,
	Flex,
	IconButton,
	Text,
} from "@radix-ui/themes";
import type { User } from "@workos-inc/node";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import signOut from "@/actions/signOut";

export function UserNav({
	user,
	role,
	organizationName,
}: {
	user: User;
	role: string | undefined;
	organizationName?: string;
}) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	const isAdmin = role === "admin";
	const isDashboard = pathname.startsWith("/dashboard");

	return (
		<DropdownMenu.Root open={open} onOpenChange={setOpen}>
			<DropdownMenu.Trigger>
				<IconButton
					variant="ghost"
					style={{ position: "relative", cursor: "pointer" }}
				>
					<Avatar
						size="2"
						radius="medium"
						src={user.profilePictureUrl as string}
						fallback={user.firstName?.[0] || <PersonIcon />}
					/>
				</IconButton>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content size="2">
				<DropdownMenu.Label>
					<Flex direction="column" gap="1">
						<Text as="p" size="3" weight="medium">
							{user.firstName}
						</Text>
						<Text as="p" size="1" style={{ color: "var(--gray-11)" }}>
							{user.email}
						</Text>
						{organizationName && (
							<Flex
								direction="column"
								mt="2"
								style={{
									borderTop: "1px solid var(--gray-6)",
									paddingTop: "8px",
								}}
							>
								<Text as="p" size="2" weight="medium">
									{organizationName}
								</Text>
								{role && (
									<Text
										as="p"
										size="1"
										style={{
											color: "var(--gray-11)",
											textTransform: "capitalize",
										}}
									>
										{role}
									</Text>
								)}
							</Flex>
						)}
					</Flex>
				</DropdownMenu.Label>
				{!isDashboard && isAdmin && (
					<>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<Link href="/dashboard">
								<DropdownMenu.Item onClick={() => setOpen(false)}>
									Dashboard
								</DropdownMenu.Item>
							</Link>
						</DropdownMenu.Group>
					</>
				)}
				{isDashboard && (
					<>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<Link href="/product">
								<DropdownMenu.Item onClick={() => setOpen(false)}>
									Product
								</DropdownMenu.Item>
							</Link>
						</DropdownMenu.Group>
					</>
				)}
				<DropdownMenu.Separator />
				<DropdownMenu.Item color="blue" onClick={() => setOpen(false)}>
					<form action={signOut}>
						<Button type="submit">Sign Out</Button>
					</form>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
}
