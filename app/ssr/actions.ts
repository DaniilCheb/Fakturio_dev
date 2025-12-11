"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "./client";

export async function addTask(name: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const client = createServerSupabaseClient();
    const response = await client.from("tasks").insert({
      name,
      user_id: userId,
    });

    console.log("Task successfully added!", response);
  } catch (error: any) {
    console.error("Error adding task:", error.message);
    throw new Error("Failed to add task");
  }
}
