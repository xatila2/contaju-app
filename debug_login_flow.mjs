import { createClient } from '@supabase/supabase-js';

// Using the project credentials from source code
const supabaseUrl = 'https://dqpkxpdgjbgbdgsmjhem.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcGt4cGRnamJnYmRnc21qaGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjkwNDYsImV4cCI6MjA4MDk0NTA0Nn0.32gXLLT7dBVVSfo8VYXUWVUVnWwUqpfsvaS4tLmiEy8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLoginFlow() {
    console.log('🔍 Check Login Flow Diagnostics');

    const email = 'leonardoricardoarantes@gmail.com';
    const password = 'friend23';

    console.log(`\n1. Authenticating as ${email}...`);
    const startAuth = Date.now();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    console.log(`⏱️ Auth Time: ${Date.now() - startAuth}ms`);

    if (authError) {
        console.error('❌ Auth Failed:', authError.message);
        return;
    }
    console.log('✅ Auth Success. User ID:', authData.user.id);

    console.log('\n2. Fetching Profile (RLS Check)...');
    const startProfile = Date.now();
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
    console.log(`⏱️ Profile Fetch Time: ${Date.now() - startProfile}ms`);

    if (profileError) {
        console.error('❌ Profile Fetch Failed:', profileError);
        // This is likely where it hangs in the app if RLS is bad
    } else {
        console.log('✅ Profile Fetched:', profileData);
    }

    console.log('\n3. Fetching Company Member (Recursive Checks?)...');
    const startMember = Date.now();
    const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select('*')
        .eq('user_id', authData.user.id);
    console.log(`⏱️ Member Fetch Time: ${Date.now() - startMember}ms`);

    if (memberError) {
        console.error('❌ Member Fetch Failed:', memberError);
    } else {
        console.log(`✅ Membersships found: ${memberData?.length}`);
    }
}

checkLoginFlow();
