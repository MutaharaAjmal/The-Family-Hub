import { supabase } from "../../../src/api/supabase";


// 1. Naya account banane ke liye
export const signUpUser = async (email: string, password: string, familyId: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        family_id: familyId, // Yeh metadata mein chala jayega
      },
    },
  });
  if (error) throw error;
  return data;
};

// 2. Login karne ke liye
export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};