"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function messagePath(path: "/login" | "/register", message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(messagePath("/login", "Email dan password wajib diisi."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(messagePath("/login", "Email atau password tidak valid."));
  }

  redirect("/");
}

export async function register(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 8) {
    redirect(
      messagePath(
        "/register",
        "Nama, email, dan password minimal 8 karakter wajib diisi.",
      ),
    );
  }

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(messagePath("/register", error.message));
  }

  if (!data.session) {
    redirect("/login?message=Periksa email Anda untuk mengonfirmasi akun.");
  }

  redirect("/");
}

export async function signInWithGoogle() {
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(messagePath("/login", error.message));
  }

  if (data.url) {
    redirect(data.url);
  }
}

