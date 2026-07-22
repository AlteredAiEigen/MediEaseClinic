import { post } from "@/lib/api-client";

export async function submitContactInquiry(payload: {
  name: string;
  email: string;
  phone: string;
  message: string;
  providerName?: string;
}) {
  return post(
    "/api/contact/contact",
    {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      providerName: payload.providerName ?? "Landing inquiry",
    },
    { auth: false }
  );
}
